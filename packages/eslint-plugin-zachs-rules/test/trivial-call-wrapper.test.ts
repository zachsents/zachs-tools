import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"
import parser from "@typescript-eslint/parser"
import plugin from "../src/index"

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const ESLINT_PLUGIN = plugin as unknown as ESLint.Plugin

async function lint(source: string) {
  return (
    await new ESLint({
      cwd: path.resolve(fileURLToPath(new URL("..", import.meta.url))),
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ["**/*.ts"],
          languageOptions: { parser },
          plugins: {
            "zachs-rules": ESLINT_PLUGIN,
          },
          rules: {
            "zachs-rules/prefer-inline-trivial-call-wrapper": "error",
          },
        },
      ],
    }).lintText(source, { filePath: "trivial-call-wrapper.ts" })
  ).flatMap((result) =>
    result.messages.map(({ message, ruleId }) => ({ message, ruleId })),
  )
}

test("reports ordered name overlap for direct and member calls", async () => {
  expect(
    await lint(`
      type Transaction = object

      declare function enqueueDeploymentJob(
        trx: Transaction,
        kind: string,
        deploymentId: string,
        payload: { deploymentId: string },
      ): Promise<void>

      async function enqueueDeploymentPlanJob(
        trx: Transaction,
        deploymentId: string,
      ) {
        await enqueueDeploymentJob(trx, "plan", deploymentId, { deploymentId })
      }

      declare const client: {
        loadHTTPUser(id: string, source: string): Promise<void>
      }

      async function loadHTTPUserProfile(id: string) {
        return await client.loadHTTPUser(id, "profile")
      }

      declare function sync_user_cache(id: string, version: number): void

      function sync_user_2_cache(id: string) {
        return sync_user_cache(id, 2)
      }

      void enqueueDeploymentPlanJob({}, "deployment-id")
      void loadHTTPUserProfile("user-id")
      sync_user_2_cache("user-id")
    `),
  ).toEqual([
    {
      ruleId: "zachs-rules/prefer-inline-trivial-call-wrapper",
      message:
        "`enqueueDeploymentPlanJob` only specializes and forwards a call to `enqueueDeploymentJob`. Consider calling `enqueueDeploymentJob` directly.",
    },
    {
      ruleId: "zachs-rules/prefer-inline-trivial-call-wrapper",
      message:
        "`loadHTTPUserProfile` only specializes and forwards a call to `loadHTTPUser`. Consider calling `loadHTTPUser` directly.",
    },
    {
      ruleId: "zachs-rules/prefer-inline-trivial-call-wrapper",
      message:
        "`sync_user_2_cache` only specializes and forwards a call to `sync_user_cache`. Consider calling `sync_user_cache` directly.",
    },
  ])
})

test("uses a 60 percent ordered token threshold", async () => {
  expect(
    await lint(`
      declare function createDeploymentJob(id: string, mode: string): void

      function createUrgentDeploymentRetryJob(id: string) {
        return createDeploymentJob(id, "urgent-retry")
      }

      function createUrgentCustomerDeploymentRetryJob(id: string) {
        return createDeploymentJob(id, "urgent-customer-retry")
      }

      createUrgentDeploymentRetryJob("one")
      createUrgentCustomerDeploymentRetryJob("two")
    `),
  ).toEqual([
    {
      ruleId: "zachs-rules/prefer-inline-trivial-call-wrapper",
      message:
        "`createUrgentDeploymentRetryJob` only specializes and forwards a call to `createDeploymentJob`. Consider calling `createDeploymentJob` directly.",
    },
  ])
})

test("does not treat reordered or weak token overlap as similar", async () => {
  expect(
    await lint(`
      declare function enqueueDeploymentJob(id: string, kind: string): void

      function enqueueJobForDeploymentPlan(id: string) {
        return enqueueDeploymentJob(id, "plan")
      }

      function prepareDeploymentPlan(id: string) {
        return enqueueDeploymentJob(id, "plan")
      }

      enqueueJobForDeploymentPlan("one")
      prepareDeploymentPlan("two")
    `),
  ).toEqual([])
})

test("skips meaningful structure and reusable or exported boundaries", async () => {
  expect(
    await lint(`
      declare function enqueueDeploymentJob(id: string, kind: string): void

      function enqueueDeploymentPlanJob(id: string) {
        return enqueueDeploymentJob(id.trim(), "plan")
      }

      function enqueueDeploymentRetryJob(id: string) {
        enqueueDeploymentJob(id, "retry")
        console.info("queued")
      }

      function enqueueDeploymentCancelJob(id: string) {
        return enqueueDeploymentJob(id, "cancel")
      }

      export function enqueueDeploymentRollbackJob(id: string) {
        return enqueueDeploymentJob(id, "rollback")
      }

      enqueueDeploymentPlanJob("one")
      enqueueDeploymentRetryJob("two")
      enqueueDeploymentCancelJob("three")
      enqueueDeploymentCancelJob("four")
      enqueueDeploymentRollbackJob("five")
    `),
  ).toEqual([])
})
