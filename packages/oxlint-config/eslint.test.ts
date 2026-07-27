import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ESLint } from "eslint"
import config from "./eslint"

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)))

async function lintTypeDeclaration(source: string) {
  return new ESLint({
    cwd: ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      ...config,
      {
        files: ["**/*.ts"],
        languageOptions: {
          parserOptions: {
            projectService: {
              allowDefaultProject: ["formatter-compatible-types.ts"],
            },
            tsconfigRootDir: ROOT,
          },
        },
      },
    ],
  }).lintText(source, { filePath: "formatter-compatible-types.ts" })
}

test("accepts documented TypeScript members without leading blank lines", async () => {
  expect(
    (
      await lintTypeDeclaration(`
export interface InterfaceOptions {
  /** Enables the interface option. */
  interfaceOption?: boolean
}

export type TypeOptions = {
  /** Enables the type option. */
  typeOption?: boolean
}
`)
    ).flatMap((result) =>
      result.messages.map(({ message, ruleId }) => ({ message, ruleId })),
    ),
  ).toEqual([])
})
