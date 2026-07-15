import { expect, test } from "bun:test"
import type { Comment, Context, Diagnostic } from "@oxlint/plugins"
import oxlintPlugin from "../src/oxlint"

function getCreateRule() {
  const rule = oxlintPlugin.rules["require-disable-directive-description"]
  if (rule.create) return rule.create

  throw new Error("Missing oxlint rule export")
}

function runRule(
  directives: ReturnType<
    Context["sourceCode"]["getDisableDirectives"]
  >["directives"],
) {
  const reports: Diagnostic[] = []
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The rule only reads sourceCode.getDisableDirectives and report from this focused mock.
  getCreateRule()({
    sourceCode: {
      getDisableDirectives: () => ({
        problems: [],
        directives,
      }),
    },
    report: (diagnostic: Diagnostic) => {
      reports.push(diagnostic)
    },
  } as unknown as Context).Program?.({
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
  })

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

test("reports oxlint disable directives without descriptions", () => {
  expect(
    runRule([
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
    ]).map((report) => report.messageId),
  ).toEqual(["missingDescription", "missingDescription", "missingDescription"])
})

test("allows described disable directives and enable directives", () => {
  expect(
    runRule([
      {
        type: "disable-next-line",
        node: createComment(
          "oxlint-disable-next-line no-console -- CLI output",
        ),
        value: "oxlint-disable-next-line no-console -- CLI output",
        justification: "CLI output",
      },
      {
        type: "enable",
        node: createComment("oxlint-enable no-console"),
        value: "oxlint-enable no-console",
      },
    ]),
  ).toEqual([])
})

test("exports every Oxlint-compatible rule", () => {
  expect(Object.keys(oxlintPlugin.rules).toSorted()).toEqual([
    "prefer-inline-module-const",
    "prefer-inline-single-use-local-const",
    "require-disable-directive-description",
  ])
})
