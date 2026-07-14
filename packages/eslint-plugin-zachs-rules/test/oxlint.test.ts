import { expect, test } from "bun:test"
import type { Comment, Context, Diagnostic, ESTree } from "@oxlint/plugins"
import { defineConfig } from "oxlint"
import oxlintRecommended from "../src/configs/oxlint-recommended"
import oxlintPlugin from "../src/oxlint"

const rule = oxlintPlugin.rules["require-disable-directive-description"]

if (!rule || typeof rule.create !== "function") {
  throw new Error("Missing oxlint rule export")
}

const createRule = rule.create

type DisableDirectives = ReturnType<
  Context["sourceCode"]["getDisableDirectives"]
>["directives"]

function runRule(directives: DisableDirectives) {
  const reports: Diagnostic[] = []
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The rule only reads sourceCode.getDisableDirectives and report from this focused mock.
  const visitor = createRule({
    sourceCode: {
      getDisableDirectives: () => ({
        problems: [],
        directives,
      }),
    },
    report: (diagnostic: Diagnostic) => {
      reports.push(diagnostic)
    },
  } as unknown as Context)

  visitor.Program?.(programNode)

  return reports
}

function createComment(value: string): Comment {
  return {
    type: "Line",
    value,
    start: 0,
    end: value.length,
    range: [0, value.length],
    loc: {
      start: { line: 1, column: 0 },
      end: { line: 1, column: value.length },
    },
  }
}

const programNode: ESTree.Program = {
  type: "Program",
  body: [],
  sourceType: "module",
  comments: [],
  tokens: [],
  parent: null,
  start: 0,
  end: 0,
  range: [0, 0],
  loc: {
    start: { line: 1, column: 0 },
    end: { line: 1, column: 0 },
  },
}

test("reports oxlint disable directives without descriptions", () => {
  const reports = runRule([
    {
      type: "disable",
      node: createComment("oxlint-disable"),
      value: "oxlint-disable",
    },
    {
      type: "disable-next-line",
      node: createComment("oxlint-disable-next-line no-console"),
      value: "oxlint-disable-next-line no-console",
    },
    {
      type: "disable-line",
      node: createComment("oxlint-disable-line no-console --"),
      value: "oxlint-disable-line no-console --",
      justification: "   ",
    },
  ])

  expect(reports.map((report) => report.messageId)).toEqual([
    "missingDescription",
    "missingDescription",
    "missingDescription",
  ])
})

test("allows described disable directives and enable directives", () => {
  const reports = runRule([
    {
      type: "disable-next-line",
      node: createComment("oxlint-disable-next-line no-console -- CLI output"),
      value: "oxlint-disable-next-line no-console -- CLI output",
      justification: "CLI output",
    },
    {
      type: "enable",
      node: createComment("oxlint-enable no-console"),
      value: "oxlint-enable no-console",
    },
  ])

  expect(reports).toEqual([])
})

test("recommended preset registers the oxlint plugin and rule", () => {
  const config = defineConfig({
    extends: [oxlintRecommended],
  })

  expect(config.extends).toEqual([
    {
      jsPlugins: [
        {
          name: "zachs-rules",
          specifier: "eslint-plugin-zachs-rules/oxlint",
        },
      ],
      rules: {
        "zachs-rules/require-disable-directive-description": "error",
      },
    },
  ])
})
