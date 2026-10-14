import { parser } from "@lezer/python";

export type SymbolKind = "function" | "async-function" | "variable";

export type SymbolTable = Record<string, { kind: SymbolKind }>;

export function buildSymbolTable(source: string): SymbolTable {
  const symbols: SymbolTable = {};
  const rootCursor = parser.parse(source).topNode.cursor();

  if (!rootCursor.firstChild()) {
    return symbols;
  }

  do {
    const statementKind = rootCursor.name;
    if (
      statementKind !== "FunctionDefinition" &&
      statementKind !== "AssignStatement"
    ) {
      continue;
    }

    const childCursor = rootCursor.node.cursor();
    let name: string | undefined;
    let isAsync = false;

    if (childCursor.firstChild()) {
      do {
        if (childCursor.name === "VariableName" && name === undefined) {
          name =
            childCursor.node.from < childCursor.node.to
              ? source.slice(childCursor.node.from, childCursor.node.to)
              : undefined;
        }
        if (childCursor.name === "async") {
          isAsync = true;
        }
      } while (childCursor.nextSibling());
    }

    if (name !== undefined) {
      symbols[name] = {
        kind:
          statementKind === "AssignStatement"
            ? "variable"
            : isAsync
              ? "async-function"
              : "function",
      };
    }
  } while (rootCursor.nextSibling());

  return symbols;
}
