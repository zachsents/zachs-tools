import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"
import parser from "@typescript-eslint/parser"
import plugin from "../src/index"

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const ESLINT_PLUGIN = plugin as unknown as ESLint.Plugin

test("runs zachs-rules custom rules", async () => {
  expect(
    (
      await new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          {
            files: ["fixtures/**/*.ts"],
            languageOptions: {
              parser,
              parserOptions: {
                projectService: true,
                tsconfigRootDir: root,
              },
            },
            plugins: {
              "zachs-rules": ESLINT_PLUGIN,
            },
            rules: {
              "zachs-rules/no-overly-broad-parameters": "error",
              "zachs-rules/no-single-use-type-alias": "error",
              "zachs-rules/prefer-inline-module-const": "error",
              "zachs-rules/prefer-inline-single-use-local-const": "error",
              "zachs-rules/prefer-object-spread-for-exact-object-map": "error",
              "zachs-rules/prefer-pick-for-object-subset-map": "error",
            },
          },
        ],
      }).lintFiles(["fixtures/**/*.ts"])
    )
      .flatMap((result) =>
        result.messages
          .filter((message) => message.ruleId?.startsWith("zachs-rules/"))
          .map(({ message, ruleId }) => ({
            file: path.relative(root, result.filePath),
            ruleId,
            message,
          }))
          .toSorted(
            (left, right) =>
              left.file.localeCompare(right.file) ||
              String(left.ruleId).localeCompare(String(right.ruleId)) ||
              left.message.localeCompare(right.message),
          ),
      )
      .toSorted(
        (left, right) =>
          left.file.localeCompare(right.file) ||
          String(left.ruleId).localeCompare(String(right.ruleId)) ||
          left.message.localeCompare(right.message),
      ),
  ).toEqual([
    {
      file: "fixtures/overly-broad-parameters.ts",
      ruleId: "zachs-rules/no-overly-broad-parameters",
      message:
        "`error` is declared as `string | Error`, but every direct call to `stringifyError` passes `Error`. Narrow the parameter type to `Error`.",
    },
    {
      file: "fixtures/overly-broad-parameters.ts",
      ruleId: "zachs-rules/no-overly-broad-parameters",
      message:
        "`error` is declared as `unknown`, but every direct call to `errorMessage` passes `Error`. Narrow the parameter type to `Error`.",
    },
    {
      file: "fixtures/overly-broad-parameters.ts",
      ruleId: "zachs-rules/no-overly-broad-parameters",
      message:
        "`error` is declared as `unknown`, but every direct call to `errorWithThis` passes `Error`. Narrow the parameter type to `Error`.",
    },
    {
      file: "fixtures/pick.ts",
      ruleId: "zachs-rules/no-single-use-type-alias",
      message:
        "`Deployment` is a type alias used only once. Consider inlining it.",
    },
    {
      file: "fixtures/pick.ts",
      ruleId: "zachs-rules/prefer-pick-for-object-subset-map",
      message:
        '`deployment` is remapped by 4 identical property names but has other known properties. Prefer `pick(deployment, ["createdAt", "id", "projectId", "status"])` or equivalent.',
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/no-single-use-type-alias",
      message:
        "`JsonRpcMessage` is a type alias used only once. Consider inlining it.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/prefer-inline-module-const",
      message:
        "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE name, or documenting it with `/** */`.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/prefer-inline-single-use-local-const",
      message:
        "`scopedOnce` is a local const used only once. Consider inlining it.",
    },
    {
      file: "fixtures/spread.ts",
      ruleId: "zachs-rules/no-single-use-type-alias",
      message:
        "`DeploymentSummary` is a type alias used only once. Consider inlining it.",
    },
    {
      file: "fixtures/spread.ts",
      ruleId: "zachs-rules/prefer-object-spread-for-exact-object-map",
      message:
        "`deployment` is remapped by identical property names for all of its known properties. Prefer `{ ...deployment }`.",
    },
    {
      file: "fixtures/valid.ts",
      ruleId: "zachs-rules/no-single-use-type-alias",
      message:
        "`UnknownDeployment` is a type alias used only once. Consider inlining it.",
    },
  ])
})

test("module const rule skips documented, constant-case, and type-only uses", async () => {
  expect(
    (
      await new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          {
            files: ["fixtures/single-use.ts"],
            languageOptions: {
              parser,
              parserOptions: {
                projectService: true,
                tsconfigRootDir: root,
              },
            },
            plugins: {
              "zachs-rules": ESLINT_PLUGIN,
            },
            rules: {
              "zachs-rules/prefer-inline-module-const": "error",
            },
          },
        ],
      }).lintFiles(["fixtures/single-use.ts"])
    ).flatMap((result) =>
      result.messages
        .filter(
          (message) =>
            message.ruleId === "zachs-rules/prefer-inline-module-const",
        )
        .map((message) => message.message)
        .toSorted(),
    ),
  ).toEqual([
    "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE name, or documenting it with `/** */`.",
  ])
})

test("can configure the maximum use threshold", async () => {
  expect(
    (
      await new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          {
            files: ["fixtures/single-use.ts"],
            languageOptions: {
              parser,
              parserOptions: {
                projectService: true,
                tsconfigRootDir: root,
              },
            },
            plugins: {
              "zachs-rules": ESLINT_PLUGIN,
            },
            rules: {
              "zachs-rules/prefer-inline-module-const": [
                "error",
                { maxUses: 2 },
              ],
            },
          },
        ],
      }).lintFiles(["fixtures/single-use.ts"])
    ).flatMap((result) =>
      result.messages
        .filter(
          (message) =>
            message.ruleId === "zachs-rules/prefer-inline-module-const",
        )
        .map((message) => message.message)
        .toSorted(),
    ),
  ).toEqual([
    "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE name, or documenting it with `/** */`.",
    "`twice` is a module-level const with only 2 runtime uses. Consider inlining it, using a SCREAMING_SNAKE_CASE name, or documenting it with `/** */`.",
  ])
})
