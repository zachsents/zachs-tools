import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint, type Linter } from "eslint"
import parser from "@typescript-eslint/parser"
import plugin from "../src/index"

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- @typescript-eslint rule modules are runtime-compatible with ESLint plugin objects, but their generic rule types do not line up exactly.
const ESLINT_PLUGIN = plugin as unknown as ESLint.Plugin
const TYPE_AWARE_LANGUAGE_OPTIONS = {
  parser,
  parserOptions: {
    projectService: {
      allowDefaultProject: ["single-use-local-const.ts"],
    },
    tsconfigRootDir: root,
  },
}

function lintSingleUseLocalConst(
  source: string,
  rule: Linter.RuleEntry = "error",
) {
  return new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts"],
        languageOptions: TYPE_AWARE_LANGUAGE_OPTIONS,
        plugins: {
          "zachs-rules": ESLINT_PLUGIN,
        },
        rules: {
          "zachs-rules/prefer-inline-single-use-local-const": rule,
        },
      },
    ],
  }).lintText(source, { filePath: "single-use-local-const.ts" })
}

test("runs zachs-rules custom rules", async () => {
  expect(
    (
      await new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          {
            files: ["fixtures/**/*.ts"],
            languageOptions: TYPE_AWARE_LANGUAGE_OPTIONS,
            plugins: {
              "zachs-rules": ESLINT_PLUGIN,
            },
            rules: {
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
        "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE or PascalCase name, or leaving a descriptive comment if it is intentionally named for readability.",
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

test("module const rule skips prominent names, functions, comments, and type-only uses", async () => {
  expect(
    (
      await new ESLint({
        cwd: root,
        overrideConfigFile: true,
        overrideConfig: [
          {
            files: ["fixtures/single-use.ts"],
            languageOptions: TYPE_AWARE_LANGUAGE_OPTIONS,
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
    "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE or PascalCase name, or leaving a descriptive comment if it is intentionally named for readability.",
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
            languageOptions: TYPE_AWARE_LANGUAGE_OPTIONS,
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
    "`once` is a module-level const with only one runtime use. Consider inlining it, using a SCREAMING_SNAKE_CASE or PascalCase name, or leaving a descriptive comment if it is intentionally named for readability.",
    "`twice` is a module-level const with only 2 runtime uses. Consider inlining it, using a SCREAMING_SNAKE_CASE or PascalCase name, or leaving a descriptive comment if it is intentionally named for readability.",
  ])
})

test("skips sole reads across execution boundaries", async () => {
  expect(
    (
      await lintSingleUseLocalConst(`
        declare function createValue(): string
        declare function use(value: string): void
        declare const condition: boolean
        declare const target: { value?: string }

        function sameExecution() {
          const direct = createValue()
          use(direct)

          const ifTest = createValue()
          if (ifTest) use("yes")

          const optionalBase = createValue()
          optionalBase?.trim()

          while (condition) {
            const perIteration = createValue()
            use(perIteration)
          }
        }

        function repeated() {
          const beforeWhile = createValue()
          while (condition) use(beforeWhile)

          const beforeFor = createValue()
          for (; condition; use(beforeFor)) {}
        }

        function conditional() {
          const branch = createValue()
          if (condition) use(branch)

          const logical = createValue()
          condition && use(logical)

          const ternary = createValue()
          condition ? use(ternary) : undefined

          const optionalArgument = createValue()
          target.value?.includes(optionalArgument)

          const caught = createValue()
          try {
            use(caught)
          } catch {}
        }

        function captured() {
          const closure = createValue()
          return () => use(closure)
        }
      `)
    ).flatMap((result) =>
      result.messages.map((message) => message.message).toSorted(),
    ),
  ).toEqual([
    "`direct` is a local const used only once. Consider inlining it.",
    "`ifTest` is a local const used only once. Consider inlining it.",
    "`optionalBase` is a local const used only once. Consider inlining it.",
    "`perIteration` is a local const used only once. Consider inlining it.",
  ])
})

test("can include sole runtime reads inside nested functions", async () => {
  expect(
    (
      await lintSingleUseLocalConst(
        `
        declare function use(value: string): void

        function captured(value: string) {
          const closure = value.trim()
          return () => use(closure)
        }
      `,
        ["error", { ignoreNestedFunctionReads: false }],
      )
    ).flatMap((result) =>
      result.messages.map((message) => message.message).toSorted(),
    ),
  ).toEqual([
    "`closure` is a local const used only once. Consider inlining it.",
  ])
})

test("skips eagerly evaluated React Hook initializers", async () => {
  expect(
    (
      await lintSingleUseLocalConst(`
        declare function consume(value: unknown): void
        declare function transform(value: unknown): unknown

        function Component() {
          const trpc = useTRPC()
          consume(trpc)

          const project = useCurrentProject().data
          consume(project)

          const transformed = transform(useSomething())
          consume(transformed)

          const context = React.useContext(Context)
          consume(context)

          const resource = use(Promise.resolve())
          consume(resource)

          const ordinaryUsePrefix = useful()
          consume(ordinaryUsePrefix)

          const deferredCallback = () => useSomething()
          consume(deferredCallback)
        }
      `)
    ).flatMap((result) =>
      result.messages.map((message) => message.message).toSorted(),
    ),
  ).toEqual([
    "`ordinaryUsePrefix` is a local const used only once. Consider inlining it.",
  ])
})
