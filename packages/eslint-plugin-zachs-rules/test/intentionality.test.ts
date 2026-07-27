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
          "zachs-rules/require-intentional-single-use-local-const": rule,
        },
      },
    ],
  }).lintText(source, { filePath: "single-use-local-const.ts" })
}

test("runs intentionality rules", async () => {
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
              "zachs-rules/require-intentional-module-const": "error",
              "zachs-rules/require-intentional-single-use-local-const": "error",
              "zachs-rules/require-intentional-single-use-type-alias": "error",
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
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-module-const",
      message:
        "`blockCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-module-const",
      message:
        "`lineCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-module-const",
      message:
        "`once` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-single-use-local-const",
      message:
        "`scopedOnce` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-single-use-type-alias",
      message:
        "`JsonRpcMessage` is a type alias used only once. Consider inlining it. If the named abstraction is intentional, add JSDoc.",
    },
    {
      file: "fixtures/single-use.ts",
      ruleId: "zachs-rules/require-intentional-single-use-type-alias",
      message:
        "`LineCommentedMessage` is a type alias used only once. Consider inlining it. If the named abstraction is intentional, add JSDoc.",
    },
  ])
})

test("module const rule skips prominent names, functions, JSDoc, and type-only uses", async () => {
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
              "zachs-rules/require-intentional-module-const": "error",
            },
          },
        ],
      }).lintFiles(["fixtures/single-use.ts"])
    ).flatMap((result) =>
      result.messages
        .filter(
          (message) =>
            message.ruleId === "zachs-rules/require-intentional-module-const",
        )
        .map((message) => message.message)
        .toSorted(),
    ),
  ).toEqual([
    "`blockCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    "`lineCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    "`once` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
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
              "zachs-rules/require-intentional-module-const": [
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
            message.ruleId === "zachs-rules/require-intentional-module-const",
        )
        .map((message) => message.message)
        .toSorted(),
    ),
  ).toEqual([
    "`blockCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    "`lineCommented` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    "`once` is a module-level const with only one runtime use. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
    "`twice` is a module-level const with only 2 runtime uses. Consider inlining it. If its name or initialization behavior is intentional, add JSDoc or use a SCREAMING_SNAKE_CASE or PascalCase name.",
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
    "`direct` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
    "`ifTest` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
    "`optionalBase` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
    "`perIteration` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
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
    "`closure` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
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
    "`ordinaryUsePrefix` is a local const used only once. Consider inlining it. If the name, evaluation order, or initialization behavior is intentional, add a comment.",
  ])
})
