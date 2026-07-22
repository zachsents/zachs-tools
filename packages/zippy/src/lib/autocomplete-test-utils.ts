import path from "node:path"
import { fileURLToPath } from "node:url"
import * as ts from "typescript"

export const completionMarker = "/* completion */"

/** Shared libDir implementation detail. */
const libDir = fileURLToPath(new URL(".", import.meta.url))

/** Shared sourceRoot implementation detail. */
const sourceRoot = path.resolve(libDir, "..")

/** Shared packageRoot implementation detail. */
const packageRoot = path.resolve(sourceRoot, "..")

/** Shared configPath implementation detail. */
const configPath = path.join(packageRoot, "tsconfig.json")

/** Shared configFile implementation detail. */
const configFile = ts.readConfigFile(configPath, (fileName) =>
  ts.sys.readFile(fileName),
)

if (configFile.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"),
  )
}

/** Shared parsedConfig implementation detail. */
const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  packageRoot,
)

/**
 * Returns string-literal completion names from a TypeScript source snippet.
 *
 * @param source - The TypeScript source snippet.
 * @throws If the source does not contain the completion marker.
 */
export function getStringLiteralCompletionNames(source: string) {
  const markerIndex = source.indexOf(completionMarker)

  if (markerIndex === -1) {
    throw new Error(`Expected source to include ${completionMarker}.`)
  }

  const probeFile = path.join(sourceRoot, "__autocomplete_probe__.ts")
  const probeSource = source.replace(completionMarker, "")
  const completionNames = (
    ts
      .createLanguageService({
        directoryExists: (directoryName) =>
          ts.sys.directoryExists(directoryName),
        fileExists: (fileName) =>
          fileName === probeFile || ts.sys.fileExists(fileName),
        getCompilationSettings: () => parsedConfig.options,
        getCurrentDirectory: () => packageRoot,
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        getDirectories: (directoryName) => ts.sys.getDirectories(directoryName),
        getScriptFileNames: () => [...parsedConfig.fileNames, probeFile],
        getScriptSnapshot: (fileName) => {
          if (fileName === probeFile) {
            return ts.ScriptSnapshot.fromString(probeSource)
          }

          if (!ts.sys.fileExists(fileName)) {
            return undefined
          }

          const fileText = ts.sys.readFile(fileName)

          return fileText === undefined
            ? undefined
            : ts.ScriptSnapshot.fromString(fileText)
        },
        getScriptVersion: () => "0",
        readDirectory: (...args) => ts.sys.readDirectory(...args),
        readFile: (fileName) =>
          fileName === probeFile ? probeSource : ts.sys.readFile(fileName),
        realpath: (fileName) => ts.sys.realpath?.(fileName) ?? fileName,
      })
      .getCompletionsAtPosition(probeFile, markerIndex, {
        includeCompletionsForImportStatements: false,
        includeCompletionsForModuleExports: false,
        includeCompletionsWithInsertText: true,
      })?.entries ?? []
  )
    .map((entry) => entry.name)
    .filter((name) => name.length > 0)

  // oxlint-disable-next-line unicorn/no-array-sort -- The mapped entries are a new array.
  completionNames.sort()
  return completionNames
}
