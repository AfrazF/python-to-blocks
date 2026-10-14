import { parser } from "@lezer/python";

export type ObjectKind =
  | "Motor"
  | "DriveBase"
  | "PrimeHub"
  | "number"
  | "string"
  | "list"
  | "unknown";

export type ObjectTable = Record<string, { objectKind: ObjectKind }>;

export function buildObjectTable(source: string): ObjectTable {
  const objects: ObjectTable = {};
  const rootCursor = parser.parse(source).topNode.cursor();

  if (!rootCursor.firstChild()) {
    return objects;
  }

  do {
    if (rootCursor.name !== "AssignStatement") {
      continue;
    }

    const statementCursor = rootCursor.node.cursor();
    let variableName: string | undefined;
    let objectKind: ObjectKind = "unknown";
    let isRightHandSide = false;

    if (statementCursor.firstChild()) {
      do {
        if (!isRightHandSide) {
          if (
            statementCursor.name === "VariableName" &&
            variableName === undefined
          ) {
            variableName = source.slice(
              statementCursor.node.from,
              statementCursor.node.to,
            );
          }

          if (statementCursor.name === "AssignOp") {
            isRightHandSide = true;
          }
          continue;
        }

        if (statementCursor.name === "CallExpression") {
          const callCursor = statementCursor.node.cursor();
          if (callCursor.firstChild()) {
            do {
              if (callCursor.name === "VariableName") {
                const functionName = source.slice(
                  callCursor.node.from,
                  callCursor.node.to,
                );
                if (
                  functionName === "Motor" ||
                  functionName === "DriveBase" ||
                  functionName === "PrimeHub"
                ) {
                  objectKind = functionName;
                }
                break;
              }
            } while (callCursor.nextSibling());
          }
        } else if (statementCursor.name === "Number") {
          objectKind = "number";
        } else if (statementCursor.name === "String") {
          objectKind = "string";
        } else if (statementCursor.name === "ArrayExpression") {
          objectKind = "list";
        }
        break;
      } while (statementCursor.nextSibling());
    }

    if (variableName !== undefined) {
      objects[variableName] = { objectKind };
    }
  } while (rootCursor.nextSibling());

  return objects;
}
