import { ESLintUtils, AST_NODE_TYPES, TSESLint } from "@typescript-eslint/utils"

type Options = [
  {
    ignoreConstantCase?: boolean
    ignoreDestructuring?: boolean
    ignoreExports?: boolean
    maxUses?: number
  }?,
]

type MessageIds = "singleUseConst"

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/zachsents/eslint-plugin-zachs-rules#${name}`,
)

function isExported(
  node: TSESLint.Scope.Definitions.VariableDefinition["parent"],
) {
  return (
    node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration ||
    node.parent.type === AST_NODE_TYPES.ExportDefaultDeclaration
  )
}

function isSimpleConstDefinition(
  variable: TSESLint.Scope.Variable,
  ignoreExports: boolean,
  ignoreDestructuring: boolean,
) {
  const def = variable.defs.at(0)

  if (!def || def.type !== TSESLint.Scope.DefinitionType.Variable) return false

  const declaration = def.parent
  const declarator = def.node

  if (declaration.kind !== "const" || declaration.declare) return false
  if (ignoreExports && isExported(declaration)) return false
  if (ignoreDestructuring && declarator.id.type !== AST_NODE_TYPES.Identifier) {
    return false
  }

  return true
}

function hasNonInitializerWrite(variable: TSESLint.Scope.Variable) {
  return variable.references.some(
    (reference) => reference.isWrite() && reference.init !== true,
  )
}

function isConstantCase(name: string) {
  return /^[A-Z][A-Z0-9_]*$/u.test(name)
}

export default createRule<Options, MessageIds>({
  name: "no-single-use-const",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Report const variables read up to a configurable threshold that can often be inlined",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreDestructuring: {
            type: "boolean",
          },
          ignoreExports: {
            type: "boolean",
          },
          ignoreConstantCase: {
            type: "boolean",
          },
          maxUses: {
            type: "integer",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      singleUseConst:
        "`{{name}}` is a const that is only used {{useCount}}. Consider inlining it.",
    },
  },
  defaultOptions: [
    {
      ignoreConstantCase: false,
      ignoreDestructuring: true,
      ignoreExports: true,
      maxUses: 1,
    },
  ],
  create(context, [options]) {
    const ignoreConstantCase = options?.ignoreConstantCase ?? false
    const ignoreDestructuring = options?.ignoreDestructuring ?? true
    const ignoreExports = options?.ignoreExports ?? true
    const maxUses = options?.maxUses ?? 1

    function checkScope(scope: TSESLint.Scope.Scope) {
      for (const variable of scope.variables) {
        if (
          !isSimpleConstDefinition(
            variable,
            ignoreExports,
            ignoreDestructuring,
          ) ||
          (ignoreConstantCase && isConstantCase(variable.name)) ||
          hasNonInitializerWrite(variable)
        ) {
          continue
        }

        const readReferences = variable.references.filter((reference) =>
          reference.isRead(),
        )
        const definition = variable.defs.at(0)

        if (
          readReferences.length >= 1 &&
          readReferences.length <= maxUses &&
          definition
        ) {
          context.report({
            node: definition.name,
            messageId: "singleUseConst",
            data: {
              name: variable.name,
              useCount:
                readReferences.length === 1
                  ? "once"
                  : `${readReferences.length} times`,
            },
          })
        }
      }

      for (const childScope of scope.childScopes) {
        checkScope(childScope)
      }
    }

    return {
      "Program:exit"() {
        const globalScope = context.sourceCode.scopeManager?.globalScope

        if (globalScope) {
          checkScope(globalScope)
        }
      },
    }
  },
})
