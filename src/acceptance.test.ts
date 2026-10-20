import { readFileSync } from "node:fs";
import { parser } from "@lezer/python";
import { expect, it } from "vitest";
import { resolveProject, type ResolvedTable } from "./resolve";

type ParseNode = ReturnType<typeof parser.parse>["topNode"];
type RawBlockDescriptor = {
  type: "pybricks_raw_code";
  filename: string;
  statementType: string;
  source: string;
};

function isSupportedAssignment(
  source: string,
  node: ParseNode,
  topLevel: boolean,
): boolean {
  const cursor = node.cursor();
  let target: ParseNode | undefined;
  let value: ParseNode | undefined;
  let afterAssignment = false;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "AssignOp") {
        afterAssignment = true;
      } else if (afterAssignment) {
        value = cursor.node;
        break;
      } else if (cursor.name === "VariableName" && !target) {
        target = cursor.node;
      }
    } while (cursor.nextSibling());
  }

  if (!target || !value) {
    return false;
  }
  if (["Number", "String", "Boolean"].includes(value.type.name)) {
    return true;
  }
  if (!topLevel || value.type.name !== "CallExpression") {
    return false;
  }

  const callCursor = value.cursor();
  let callee: ParseNode | undefined;
  if (callCursor.firstChild()) {
    do {
      if (callCursor.name === "ArgList") {
        break;
      }
      callee ??= callCursor.node;
    } while (callCursor.nextSibling());
  }
  return (
    callee?.type.name === "VariableName" &&
    ["PrimeHub", "Motor", "DriveBase"].includes(
      source.slice(callee.from, callee.to),
    )
  );
}

function isSupportedImport(node: ParseNode): boolean {
  const cursor = node.cursor();
  let moduleParts = 0;
  let bindings = 0;
  let readingModule = false;
  let readingNames = false;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "from") {
        readingModule = true;
      } else if (readingModule && cursor.name === "import") {
        readingModule = false;
        readingNames = true;
      } else if (readingModule && cursor.name === "VariableName") {
        moduleParts += 1;
      } else if (readingNames && cursor.name === "VariableName") {
        bindings += 1;
      }
    } while (cursor.nextSibling());
  }
  return moduleParts > 0 && bindings > 0;
}

function readCallExpression(
  node: ParseNode,
): { callee: ParseNode; argumentList: ParseNode } | undefined {
  if (node.type.name !== "CallExpression") {
    return undefined;
  }

  const cursor = node.cursor();
  let callee: ParseNode | undefined;
  let argumentList: ParseNode | undefined;
  if (cursor.firstChild()) {
    do {
      if (cursor.name === "ArgList") {
        argumentList = cursor.node;
      } else {
        callee ??= cursor.node;
      }
    } while (cursor.nextSibling());
  }
  return callee && argumentList ? { callee, argumentList } : undefined;
}

function getPositionalArguments(argumentList: ParseNode): ParseNode[] {
  const positional: ParseNode[] = [];
  const cursor = argumentList.cursor();
  let argumentNodes: ParseNode[] = [];
  const saveArgument = () => {
    if (
      argumentNodes.length > 0 &&
      !argumentNodes.some((argumentNode) => argumentNode.name === "AssignOp")
    ) {
      positional.push(argumentNodes[0]);
    }
    argumentNodes = [];
  };

  if (cursor.firstChild()) {
    do {
      if (
        cursor.name === "(" ||
        cursor.name === ")" ||
        cursor.name === "Comment"
      ) {
        continue;
      }
      if (cursor.name === ",") {
        saveArgument();
      } else {
        argumentNodes.push(cursor.node);
      }
    } while (cursor.nextSibling());
  }
  saveArgument();
  return positional;
}

function isSupportedCallExpression(source: string, node: ParseNode): boolean {
  const call = readCallExpression(node);
  if (!call) {
    return false;
  }
  if (call.callee.type.name === "VariableName") {
    return true;
  }
  if (call.callee.type.name !== "MemberExpression") {
    return false;
  }

  const cursor = call.callee.cursor();
  let objectName: string | undefined;
  let methodName: string | undefined;
  if (cursor.firstChild()) {
    do {
      if (cursor.name === "VariableName" && objectName === undefined) {
        objectName = source.slice(cursor.node.from, cursor.node.to);
      } else if (cursor.name === "PropertyName") {
        methodName = source.slice(cursor.node.from, cursor.node.to);
      }
    } while (cursor.nextSibling());
  }
  return Boolean(objectName && methodName);
}

function isMultitaskCall(source: string, node: ParseNode): boolean {
  const call = readCallExpression(node);
  return (
    call?.callee.type.name === "VariableName" &&
    source.slice(call.callee.from, call.callee.to) === "multitask"
  );
}

function isSupportedExpression(source: string, node: ParseNode): boolean {
  if (node.type.name === "AwaitExpression") {
    const cursor = node.cursor();
    if (cursor.firstChild()) {
      do {
        if (cursor.name === "await") {
          continue;
        }
        if (isMultitaskCall(source, cursor.node)) {
          const call = readCallExpression(cursor.node);
          return Boolean(
            call &&
            getPositionalArguments(call.argumentList).every((argument) =>
              isSupportedExpression(source, argument),
            ),
          );
        }
        return isSupportedExpression(source, cursor.node);
      } while (cursor.nextSibling());
    }
    return false;
  }

  return isSupportedCallExpression(source, node);
}

function countRawBlocks(
  source: string,
  _resolvedTable: ResolvedTable,
  filename: string,
): RawBlockDescriptor[] {
  const rawBlocks: RawBlockDescriptor[] = [];

  const addRawBlock = (node: ParseNode) => {
    rawBlocks.push({
      type: "pybricks_raw_code",
      filename,
      statementType: node.type.name,
      source: source.slice(node.from, node.to),
    });
  };

  const visitStatements = (node: ParseNode, topLevel: boolean) => {
    const cursor = node.cursor();
    let docstringConsumed = false;
    if (!cursor.firstChild()) {
      return;
    }

    do {
      if (cursor.name === "Comment") {
        continue;
      }

      if (topLevel && cursor.name === "FunctionDefinition") {
        docstringConsumed = true;
        const functionCursor = cursor.node.cursor();
        if (functionCursor.firstChild()) {
          do {
            if (functionCursor.name === "Body") {
              visitStatements(functionCursor.node, false);
              break;
            }
          } while (functionCursor.nextSibling());
        }
        continue;
      }

      if ([":", "Indent", "Dedent"].includes(cursor.name)) {
        continue;
      }

      if (!docstringConsumed && cursor.name === "ExpressionStatement") {
        const expressionCursor = cursor.node.cursor();
        if (
          expressionCursor.firstChild() &&
          expressionCursor.name === "String" &&
          !expressionCursor.nextSibling()
        ) {
          docstringConsumed = true;
          continue;
        }
      }

      docstringConsumed = true;
      if (topLevel && cursor.name === "ImportStatement") {
        if (!isSupportedImport(cursor.node)) {
          addRawBlock(cursor.node);
        }
      } else if (cursor.name === "AssignStatement") {
        if (!isSupportedAssignment(source, cursor.node, topLevel)) {
          addRawBlock(cursor.node);
        }
      } else if (cursor.name === "PassStatement") {
        continue;
      } else if (cursor.name === "ExpressionStatement") {
        const expressionCursor = cursor.node.cursor();
        if (
          !expressionCursor.firstChild() ||
          !isSupportedExpression(source, expressionCursor.node)
        ) {
          addRawBlock(cursor.node);
        }
      } else {
        addRawBlock(cursor.node);
      }
    } while (cursor.nextSibling());
  };

  visitStatements(parser.parse(source).topNode, true);
  return rawBlocks;
}

it("robot.py and exampleattach.py render with zero raw blocks", () => {
  const robot = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const attach = readFileSync(
    new URL("../fixtures/exampleattach.py", import.meta.url),
    "utf8",
  );
  const resolved = resolveProject({
    "robot.py": robot,
    "exampleattach.py": attach,
  });

  const robotRaw = countRawBlocks(robot, resolved["robot.py"], "robot.py");
  const attachRaw = countRawBlocks(
    attach,
    resolved["exampleattach.py"],
    "exampleattach.py",
  );

  expect(robotRaw).toEqual([]);
  expect(attachRaw).toEqual([]);
});
