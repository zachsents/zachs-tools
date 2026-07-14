import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"
import { defineConfig } from "eslint/config"
import parser from "@typescript-eslint/parser"
import plugin from "../src/index"

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const eslintPlugin = plugin as unknown as ESLint.Plugin

test("runs zachs-rules custom rules", async () => {
  const eslint = new ESLint({
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
          "zachs-rules": eslintPlugin,
        },
        rules: {
          "zachs-rules/no-overly-broad-parameters": "error",
          "zachs-rules/no-single-use-const": "error",
          "zachs-rules/prefer-object-spread-for-exact-object-map": "error",
          "zachs-rules/prefer-pick-for-object-subset-map": "error",
        },
      },
    ],
  })

  const results = await eslint.lintFiles(["fixtures/**/*.ts"])

  const customMessages = results
    .flatMap((result) =>
      result.messages
        .filter((message) => message.ruleId?.startsWith("zachs-rules/"))
        .map((message) => ({
          file: path.relative(root, result.filePath),
          ruleId: message.ruleId,
          message: message.message,
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
    )

  expect(customMessages).toEqual([
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
      ruleId: "zachs-rules/prefer-pick-for-object-subset-map",
      message:
        '`deployment` is remapped by 4 identical property names but has other known properties. Prefer `pick(deployment, ["createdAt", "id", "projectId", "status"])` or equivalent.',
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/no-single-use-const",
      message:
        "`API_URL` is a const that is only used once. Consider inlining it.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/no-single-use-const",
      message:
        "`once` is a const that is only used once. Consider inlining it.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/no-single-use-const",
      message:
        "`scopedOnce` is a const that is only used once. Consider inlining it.",
    },
    {
      file: "fixtures/spread.ts",
      ruleId: "zachs-rules/prefer-object-spread-for-exact-object-map",
      message:
        "`deployment` is remapped by identical property names for all of its known properties. Prefer `{ ...deployment }`.",
    },
  ])
})

test("can ignore constant-case single-use const names", async () => {
  const eslint = new ESLint({
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
          "zachs-rules": eslintPlugin,
        },
        rules: {
          "zachs-rules/no-single-use-const": [
            "error",
            { ignoreConstantCase: true },
          ],
        },
      },
    ],
  })

  const results = await eslint.lintFiles(["fixtures/single-use.ts"])
  const messages = results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId === "zachs-rules/no-single-use-const")
      .map((message) => message.message)
      .toSorted(),
  )

  expect(messages).toEqual([
    "`once` is a const that is only used once. Consider inlining it.",
    "`scopedOnce` is a const that is only used once. Consider inlining it.",
  ])
})

test("can configure the maximum use threshold", async () => {
  const eslint = new ESLint({
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
          "zachs-rules": eslintPlugin,
        },
        rules: {
          "zachs-rules/no-single-use-const": ["error", { maxUses: 2 }],
        },
      },
    ],
  })

  const results = await eslint.lintFiles(["fixtures/single-use.ts"])
  const messages = results.flatMap((result) =>
    result.messages
      .filter((message) => message.ruleId === "zachs-rules/no-single-use-const")
      .map((message) => message.message)
      .toSorted(),
  )

  expect(messages).toEqual([
    "`API_URL` is a const that is only used once. Consider inlining it.",
    "`once` is a const that is only used once. Consider inlining it.",
    "`scopedOnce` is a const that is only used once. Consider inlining it.",
    "`twice` is a const that is only used 2 times. Consider inlining it.",
  ])
})

test("recommended preset registers its rule and default options", async () => {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
  })

  const [result] = await eslint.lintText(
    "const API_URL = 'https://example.com'; const value = 1; console.log(API_URL, value, value, value)",
  )

  expect(
    result?.messages
      .filter((message) => message.ruleId?.startsWith("zachs-rules/"))
      .map((message) => message.ruleId),
  ).toEqual(["zachs-rules/no-single-use-const"])
})

test("recommended-type-checked preset runs every ESLint rule", async () => {
  const config = defineConfig([plugin.configs["recommended-type-checked"]])
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: config,
  })

  const results = await eslint.lintFiles(["fixtures/**/*.ts"])
  const ruleIds = new Set(
    results.flatMap((result) =>
      result.messages.flatMap((message) =>
        message.ruleId?.startsWith("zachs-rules/") ? [message.ruleId] : [],
      ),
    ),
  )

  expect(ruleIds).toEqual(
    new Set([
      "zachs-rules/no-overly-broad-parameters",
      "zachs-rules/no-single-use-const",
      "zachs-rules/prefer-object-spread-for-exact-object-map",
      "zachs-rules/prefer-pick-for-object-subset-map",
    ]),
  )
})
