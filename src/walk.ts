import * as Blockly from "blockly";
import { parser } from "@lezer/python";
import type { ResolvedTable } from "./resolve";

type ParseNode = ReturnType<typeof parser.parse>["topNode"];

function getParameters(source: string, parameterList: ParseNode): string {
  const parameters: string[] = [];
  const cursor = parameterList.cursor();
  let parameterStart: number | undefined;
  let parameterEnd: number | undefined;

  const saveParameter = () => {
    if (parameterStart !== undefined && parameterEnd !== undefined) {
      parameters.push(
        source
          .slice(parameterStart, parameterEnd)
          .trim()
          .replace(/\s*=\s*/g, "="),
      );
    }
    parameterStart = undefined;
    parameterEnd = undefined;
  };

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "(" || cursor.name === ")") {
        continue;
      }
      if (cursor.name === ",") {
        saveParameter();
        continue;
      }
      parameterStart ??= cursor.node.from;
      parameterEnd = cursor.node.to;
    } while (cursor.nextSibling());
  }
  saveParameter();

  return parameters.join(", ");
}

function createRawBlock(
  source: string,
  node: ParseNode,
  workspace: Blockly.WorkspaceSvg,
): Blockly.BlockSvg {
  const block = workspace.newBlock("pybricks_raw_code");
  block.setFieldValue(source.slice(node.from, node.to), "CODE");
  block.initSvg();
  block.render();
  return block;
}

function createVariableBlock(
  source: string,
  node: ParseNode,
  workspace: Blockly.WorkspaceSvg,
  topLevel: boolean,
): Blockly.BlockSvg | undefined {
  const cursor = node.cursor();
  let variableName: ParseNode | undefined;
  let value: ParseNode | undefined;
  let isRightHandSide = false;

  if (cursor.firstChild()) {
    do {
      if (!isRightHandSide) {
        if (cursor.name === "VariableName" && variableName === undefined) {
          variableName = cursor.node;
        } else if (cursor.name === "AssignOp") {
          isRightHandSide = true;
        }
        continue;
      }

      value = cursor.node;
      break;
    } while (cursor.nextSibling());
  }

  if (
    !variableName ||
    !value ||
    !["Number", "String", "Boolean"].includes(value.type.name)
  ) {
    return undefined;
  }

  const block = workspace.newBlock(
    topLevel ? "pybricks_var_declare" : "pybricks_var_set",
  );
  block.setFieldValue(source.slice(variableName.from, variableName.to), "NAME");
  block.setFieldValue(source.slice(value.from, value.to), "VALUE");
  block.initSvg();
  block.render();
  return block;
}

function createHardwareBlock(
  source: string,
  node: ParseNode,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): Blockly.BlockSvg | undefined {
  const assignmentCursor = node.cursor();
  let targetName: ParseNode | undefined;
  let rightHandSide: ParseNode | undefined;
  let afterAssignment = false;

  if (assignmentCursor.firstChild()) {
    do {
      if (assignmentCursor.name === "AssignOp") {
        afterAssignment = true;
        continue;
      }
      if (!afterAssignment) {
        if (assignmentCursor.name === "VariableName" && !targetName) {
          targetName = assignmentCursor.node;
        }
        continue;
      }
      rightHandSide = assignmentCursor.node;
      break;
    } while (assignmentCursor.nextSibling());
  }

  if (!targetName || rightHandSide?.type.name !== "CallExpression") {
    return undefined;
  }

  const callCursor = rightHandSide.cursor();
  let callee: ParseNode | undefined;
  let argumentList: ParseNode | undefined;

  if (callCursor.firstChild()) {
    do {
      if (callCursor.name === "ArgList") {
        argumentList = callCursor.node;
      } else if (!callee) {
        callee = callCursor.node;
      }
    } while (callCursor.nextSibling());
  }

  if (callee?.type.name !== "VariableName") {
    return undefined;
  }

  const target = source.slice(targetName.from, targetName.to);
  const constructor = source.slice(callee.from, callee.to);
  let type: string;
  let fields: Record<string, string>;
  let driveBaseArguments: string[] | undefined;

  if (constructor === "PrimeHub") {
    type = "pybricks_hub";
    fields = { NAME: target };
  } else if (constructor === "Motor") {
    const positional = argumentList
      ? getCallArgumentValues(source, argumentList).positional
      : [];
    type = "pybricks_motor_setup";
    fields = {
      NAME: target,
      PORT: positional[0]?.replace(/^Port\./, "") ?? "A",
      DIRECTION:
        positional[1]?.replace(/^Direction\./, "").toLowerCase() ?? "clockwise",
    };
  } else if (constructor === "DriveBase") {
    const positional = argumentList
      ? getCallArgumentValues(source, argumentList).positional
      : [];
    type = "pybricks_drivebase_setup";
    fields = { NAME: target };
    driveBaseArguments = positional;
  } else {
    return undefined;
  }

  const block = workspace.newBlock(type);
  for (const [field, value] of Object.entries(fields)) {
    block.setFieldValue(value, field);
  }
  block.initSvg();
  block.render();
  if (driveBaseArguments) {
    ["LEFT", "RIGHT", "WHEEL", "TRACK"].forEach((inputName, index) => {
      const argument = driveBaseArguments?.[index];
      if (argument !== undefined) {
        attachArg(block, inputName, argument, workspace, resolved);
      }
    });
    block.render();
  }
  return block;
}

function getCallArguments(source: string, argumentList: ParseNode): string {
  const cursor = argumentList.cursor();
  let openingParenEnd: number | undefined;
  let closingParenStart: number | undefined;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "(" && openingParenEnd === undefined) {
        openingParenEnd = cursor.node.to;
      }
      if (cursor.name === ")") {
        closingParenStart = cursor.node.from;
      }
    } while (cursor.nextSibling());
  }

  if (openingParenEnd === undefined || closingParenStart === undefined) {
    return "";
  }
  return source.slice(openingParenEnd, closingParenStart);
}

function getCallArgumentValues(
  source: string,
  argumentList: ParseNode,
): { positional: string[]; keywords: Record<string, string> } {
  const positional: string[] = [];
  const keywords: Record<string, string> = {};
  const cursor = argumentList.cursor();
  let argumentNodes: ParseNode[] = [];

  const saveArgument = () => {
    if (argumentNodes.length === 0) {
      return;
    }

    const assignment = argumentNodes.find(
      (argumentNode) => argumentNode.name === "AssignOp",
    );
    const start = argumentNodes[0].from;
    const end = argumentNodes.at(-1)!.to;
    if (assignment) {
      const keywordNode = argumentNodes.find(
        (argumentNode) => argumentNode.name === "VariableName",
      );
      if (keywordNode) {
        const keyword = source.slice(keywordNode.from, keywordNode.to);
        keywords[keyword] = source.slice(assignment.to, end).trim();
      }
    } else {
      positional.push(source.slice(start, end).trim());
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

  return { positional, keywords };
}

function getCallArgumentNodes(argumentList: ParseNode): ParseNode[] {
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

function attachArg(
  block: Blockly.Block,
  inputName: string,
  argSource: string,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): void {
  const text = argSource.trim();
  const entry = resolved[text];
  const input = block.getInput(inputName);
  if (!input?.connection) {
    return;
  }

  if (entry && (entry.kind === "variable" || entry.objectKind)) {
    const reporter = workspace.newBlock("pybricks_var_reporter");
    reporter.initSvg();
    reporter.setFieldValue(text, "NAME");
    if (reporter.outputConnection) {
      input.connection.connect(reporter.outputConnection);
    }
    return;
  }

  const shadow = input.connection.targetBlock();
  if (shadow?.type === "math_number") {
    shadow.setFieldValue(text, "NUM");
  }
}

function getFunctionResolvedTable(
  source: string,
  parameterList: ParseNode,
  resolved: ResolvedTable,
): ResolvedTable {
  const cursor = parameterList.cursor();
  let expectingParameterName = true;
  let scopedResolved: ResolvedTable | undefined;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "(" || cursor.name === ")") {
        continue;
      }
      if (cursor.name === ",") {
        expectingParameterName = true;
        continue;
      }
      if (cursor.name === "VariableName" && expectingParameterName) {
        const parameterName = source.slice(cursor.node.from, cursor.node.to);
        scopedResolved ??= { ...resolved };
        scopedResolved[parameterName] = {
          kind: "variable",
          ...(parameterName === "motor"
            ? { objectKind: "Motor" as const }
            : {}),
          origin: "parameter",
        };
        expectingParameterName = false;
      } else if (cursor.name === "AssignOp") {
        expectingParameterName = false;
      }
    } while (cursor.nextSibling());
  }

  return scopedResolved ?? resolved;
}

function getThenMode(value: string | undefined, defaultValue: string): string {
  const match = value?.match(/^Stop\.(COAST|BRAKE|HOLD)$/);
  return match ? match[1].toLowerCase() : defaultValue;
}

function createMotorBlock(
  workspace: Blockly.WorkspaceSvg,
  type: string,
  fields: Record<string, string>,
  args: Record<string, string>,
  resolved: ResolvedTable,
): Blockly.BlockSvg {
  const block = workspace.newBlock(type);
  for (const [field, value] of Object.entries(fields)) {
    block.setFieldValue(value, field);
  }
  block.initSvg();
  block.render();
  for (const [inputName, value] of Object.entries(args)) {
    attachArg(block, inputName, value, workspace, resolved);
  }
  block.render();
  return block;
}

function createDriveSettingsBlocks(
  source: string,
  expression: ParseNode,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): Blockly.BlockSvg[] | undefined {
  if (expression.type.name !== "CallExpression") {
    return undefined;
  }

  const cursor = expression.cursor();
  let callee: ParseNode | undefined;
  let argumentList: ParseNode | undefined;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "ArgList") {
        argumentList = cursor.node;
      } else if (!callee) {
        callee = cursor.node;
      }
    } while (cursor.nextSibling());
  }

  if (callee?.type.name !== "MemberExpression" || !argumentList) {
    return undefined;
  }

  const memberCursor = callee.cursor();
  let objectName: string | undefined;
  let methodName: string | undefined;

  if (memberCursor.firstChild()) {
    do {
      if (memberCursor.name === "VariableName" && objectName === undefined) {
        objectName = source.slice(memberCursor.node.from, memberCursor.node.to);
      } else if (memberCursor.name === "PropertyName") {
        methodName = source.slice(memberCursor.node.from, memberCursor.node.to);
      }
    } while (memberCursor.nextSibling());
  }

  if (
    !objectName ||
    methodName !== "settings" ||
    resolved[objectName]?.objectKind !== "DriveBase"
  ) {
    return undefined;
  }

  const { keywords } = getCallArgumentValues(source, argumentList);
  const whatByKeyword: Record<string, string> = {
    straight_speed: "drive speed",
    straight_acceleration: "drive acceleration",
    turn_rate: "turn speed",
    turn_acceleration: "turn acceleration",
  };

  return Object.entries(keywords).flatMap(([keyword, value]) => {
    const what = whatByKeyword[keyword];
    if (!what) {
      return [];
    }

    const block = workspace.newBlock("pybricks_drive_configure");
    block.setFieldValue(what, "WHAT");
    block.initSvg();
    block.render();
    attachArg(block, "VALUE", value, workspace, resolved);
    block.render();
    return [block];
  });
}

function createExpressionBlock(
  source: string,
  expression: ParseNode,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): Blockly.BlockSvg {
  if (expression.type.name === "AwaitExpression") {
    const cursor = expression.cursor();
    let innerExpression: ParseNode | undefined;

    if (cursor.firstChild()) {
      do {
        if (cursor.name !== "await") {
          innerExpression = cursor.node;
          break;
        }
      } while (cursor.nextSibling());
    }

    const block = workspace.newBlock("pybricks_await");
    block.initSvg();
    block.render();

    const innerConnection = block.getInput("INNER")?.connection;
    if (!innerExpression || !innerConnection) {
      throw new Error("Await blocks must have an INNER statement input.");
    }

    const innerBlock = createExpressionBlock(
      source,
      innerExpression,
      workspace,
      resolved,
    );
    if (!innerBlock.previousConnection) {
      throw new Error(
        "Await expression blocks must have a previous connection.",
      );
    }
    innerBlock.previousConnection.connect(innerConnection);
    block.render();
    return block;
  }

  if (expression.type.name === "CallExpression") {
    const cursor = expression.cursor();
    let callee: ParseNode | undefined;
    let argumentList: ParseNode | undefined;

    if (cursor.firstChild()) {
      do {
        if (cursor.name === "ArgList") {
          argumentList = cursor.node;
        } else if (!callee) {
          callee = cursor.node;
        }
      } while (cursor.nextSibling());
    }

    if (callee?.type.name === "VariableName" && argumentList) {
      const block = workspace.newBlock("pybricks_call");
      block.setFieldValue(source.slice(callee.from, callee.to), "NAME");
      block.setFieldValue(getCallArguments(source, argumentList), "ARGS");
      block.initSvg();
      block.render();
      return block;
    }

    if (callee?.type.name === "MemberExpression" && argumentList) {
      const memberCursor = callee.cursor();
      let objectName: string | undefined;
      let methodName: string | undefined;

      if (memberCursor.firstChild()) {
        do {
          if (
            memberCursor.name === "VariableName" &&
            objectName === undefined
          ) {
            objectName = source.slice(
              memberCursor.node.from,
              memberCursor.node.to,
            );
          } else if (memberCursor.name === "PropertyName") {
            methodName = source.slice(
              memberCursor.node.from,
              memberCursor.node.to,
            );
          }
        } while (memberCursor.nextSibling());
      }

      if (
        objectName &&
        methodName &&
        resolved[objectName]?.objectKind === "DriveBase"
      ) {
        const { positional, keywords } = getCallArgumentValues(
          source,
          argumentList,
        );

        if (methodName === "straight" || methodName === "turn") {
          const thenValue = /^Stop\.(COAST|BRAKE|HOLD)$/.test(
            keywords.then ?? "",
          )
            ? keywords.then.slice("Stop.".length).toLowerCase()
            : "hold";
          const block = workspace.newBlock("pybricks_drive_move");
          block.setFieldValue(methodName, "MODE");
          block.setFieldValue(thenValue, "THEN");
          block.initSvg();
          block.render();
          attachArg(block, "AMOUNT", positional[0] ?? "0", workspace, resolved);
          block.render();
          return block;
        }

        if (methodName === "reset") {
          const block = workspace.newBlock("pybricks_drive_reset");
          block.initSvg();
          block.render();
          attachArg(
            block,
            "DISTANCE",
            keywords.distance ?? positional[0] ?? "0",
            workspace,
            resolved,
          );
          attachArg(
            block,
            "ANGLE",
            keywords.angle ?? positional[1] ?? "0",
            workspace,
            resolved,
          );
          block.render();
          return block;
        }

        if (methodName === "use_gyro") {
          const value = positional[0] ?? keywords.value;
          const block = workspace.newBlock("pybricks_drive_use_gyro");
          block.setFieldValue(value === "True" ? "gyro" : "no gyro", "VALUE");
          block.initSvg();
          block.render();
          return block;
        }
      }

      if (
        objectName &&
        methodName &&
        resolved[objectName]?.objectKind === "Motor"
      ) {
        const { positional, keywords } = getCallArgumentValues(
          source,
          argumentList,
        );
        const motor = objectName;

        if (methodName === "run_target") {
          return createMotorBlock(
            workspace,
            "pybricks_motor_run_target",
            {
              MOTOR: motor,
              THEN: getThenMode(keywords.then, "hold"),
            },
            {
              SPEED: positional[0] ?? "0",
              TARGET: positional[1] ?? "0",
            },
            resolved,
          );
        }

        if (methodName === "run_angle") {
          return createMotorBlock(
            workspace,
            "pybricks_motor_run_angle",
            {
              MOTOR: motor,
              THEN: getThenMode(keywords.then, "hold"),
            },
            {
              SPEED: positional[0] ?? "0",
              ANGLE: positional[1] ?? "0",
            },
            resolved,
          );
        }

        if (methodName === "run_until_stalled") {
          return createMotorBlock(
            workspace,
            "pybricks_motor_run_until_stalled",
            {
              MOTOR: motor,
              THEN: getThenMode(keywords.then ?? positional[1], "hold"),
            },
            {
              SPEED: positional[0] ?? "0",
              DUTY: keywords.duty_limit ?? positional[2] ?? "0",
            },
            resolved,
          );
        }

        if (methodName === "reset_angle") {
          return createMotorBlock(
            workspace,
            "pybricks_motor_reset_angle",
            {
              MOTOR: motor,
            },
            {
              VALUE: positional[0] ?? "0",
            },
            resolved,
          );
        }

        if (methodName === "stop") {
          return createMotorBlock(
            workspace,
            "pybricks_motor_stop",
            {
              MOTOR: motor,
              MODE: getThenMode(keywords.mode ?? positional[0], "coast"),
            },
            {},
            resolved,
          );
        }
      }

      if (objectName && methodName) {
        const block = workspace.newBlock("pybricks_method_call");
        block.setFieldValue(objectName, "OBJ");
        block.setFieldValue(methodName, "METHOD");
        block.setFieldValue(getCallArguments(source, argumentList), "ARGS");
        block.initSvg();
        block.render();
        return block;
      }
    }
  }

  return createRawBlock(source, expression, workspace);
}

function renderExpressionAsStatement(
  source: string,
  exprNode: ParseNode,
  connection: Blockly.Connection,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): Blockly.Block | null {
  let block: Blockly.BlockSvg;

  if (exprNode.type.name === "AwaitExpression") {
    const awaitCursor = exprNode.cursor();
    let innerExpression: ParseNode | undefined;
    if (awaitCursor.firstChild()) {
      do {
        if (awaitCursor.name !== "await") {
          innerExpression = awaitCursor.node;
          break;
        }
      } while (awaitCursor.nextSibling());
    }

    if (innerExpression?.type.name === "CallExpression") {
      const callCursor = innerExpression.cursor();
      let callee: ParseNode | undefined;
      let argumentList: ParseNode | undefined;
      if (callCursor.firstChild()) {
        do {
          if (callCursor.name === "ArgList") {
            argumentList = callCursor.node;
          } else if (!callee) {
            callee = callCursor.node;
          }
        } while (callCursor.nextSibling());
      }

      if (
        callee?.type.name === "VariableName" &&
        source.slice(callee.from, callee.to) === "multitask" &&
        argumentList
      ) {
        const arguments_ = getCallArgumentNodes(argumentList);
        const { keywords } = getCallArgumentValues(source, argumentList);
        const taskCount = Math.max(1, arguments_.length);
        block = workspace.newBlock("pybricks_multitask");
        (
          block as Blockly.BlockSvg & {
            loadExtraState: (state: { taskCount: number }) => void;
          }
        ).loadExtraState({ taskCount });
        block.setFieldValue(keywords.race === "True" ? "any" : "all", "MODE");
        block.initSvg();
        block.render();

        arguments_.forEach((argument, index) => {
          const taskConnection = block.getInput(`TASK${index}`)?.connection;
          if (!taskConnection) {
            throw new Error(`Multitask blocks need a TASK${index} input.`);
          }
          renderExpressionAsStatement(
            source,
            argument,
            taskConnection,
            workspace,
            resolved,
          );
        });
      } else {
        block = createExpressionBlock(source, exprNode, workspace, resolved);
      }
    } else {
      block = createExpressionBlock(source, exprNode, workspace, resolved);
    }
  } else {
    block = createExpressionBlock(source, exprNode, workspace, resolved);
  }

  if (!block.previousConnection) {
    return null;
  }
  block.previousConnection.connect(connection);
  return block;
}

type ImportBinding = { name: string; alias?: string };

function readFromImport(
  source: string,
  node: ParseNode,
): { moduleName: string; bindings: ImportBinding[] } | undefined {
  const cursor = node.cursor();
  const moduleParts: string[] = [];
  const bindings: ImportBinding[] = [];
  let readingModule = false;
  let readingNames = false;
  let expectingAlias = false;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "from") {
        readingModule = true;
        continue;
      }
      if (readingModule && cursor.name === "import") {
        readingModule = false;
        readingNames = true;
        continue;
      }
      if (readingModule && cursor.name === "VariableName") {
        moduleParts.push(source.slice(cursor.node.from, cursor.node.to));
        continue;
      }
      if (!readingNames) {
        continue;
      }
      if (cursor.name === "as") {
        expectingAlias = true;
      } else if (cursor.name === ",") {
        expectingAlias = false;
      } else if (cursor.name === "VariableName") {
        const name = source.slice(cursor.node.from, cursor.node.to);
        const lastBinding = bindings.at(-1);
        if (expectingAlias && lastBinding) {
          lastBinding.alias = name;
          expectingAlias = false;
        } else {
          bindings.push({ name });
        }
      }
    } while (cursor.nextSibling());
  }

  if (moduleParts.length === 0 || bindings.length === 0) {
    return undefined;
  }

  return { moduleName: moduleParts.join("."), bindings };
}

function createImportBlocks(
  source: string,
  node: ParseNode,
  workspace: Blockly.WorkspaceSvg,
): Blockly.BlockSvg[] | undefined {
  const parsedImport = readFromImport(source, node);
  if (!parsedImport) {
    return undefined;
  }

  return parsedImport.bindings.map((binding) => {
    const block = workspace.newBlock(
      binding.alias ? "pybricks_import_as" : "pybricks_import",
    );
    block.setFieldValue(parsedImport.moduleName, "MODULE");
    block.setFieldValue(binding.name, "NAME");
    if (binding.alias) {
      block.setFieldValue(binding.alias, "ALIAS");
    }
    block.initSvg();
    block.render();
    return block;
  });
}

function renderStatements(
  source: string,
  node: ParseNode,
  connection: Blockly.Connection,
  workspace: Blockly.WorkspaceSvg,
  topLevel: boolean,
  resolved: ResolvedTable,
): void {
  const cursor = node.cursor();
  const functionNodes: ParseNode[] = [];
  let nextConnection = connection;
  let lastBlock: Blockly.BlockSvg | null = null;
  let previousNonCommentNode: ParseNode | undefined;

  if (!cursor.firstChild()) {
    return;
  }

  do {
    if (cursor.name === "Comment") {
      const commentNode = cursor.node;
      const isStandalone =
        previousNonCommentNode === undefined ||
        source
          .slice(previousNonCommentNode.to, commentNode.from)
          .includes("\n");

      if (!isStandalone && lastBlock) {
        const commentText = source
          .slice(commentNode.from, commentNode.to)
          .replace(/^# ?/, "");
        lastBlock.setCommentText(commentText);
        continue;
      }

      const block = workspace.newBlock("pybricks_comment");
      block.setFieldValue(
        source.slice(commentNode.from, commentNode.to),
        "TEXT",
      );
      block.initSvg();
      block.render();
      const previousConnection = block.previousConnection;
      if (!previousConnection || !nextConnection) {
        throw new Error("Comment blocks must have previous connections.");
      }
      previousConnection.connect(nextConnection);
      if (!block.nextConnection) {
        throw new Error("Comment blocks must have next connections.");
      }
      nextConnection = block.nextConnection;
      lastBlock = block;
      continue;
    }

    if (topLevel && cursor.name === "FunctionDefinition") {
      functionNodes.push(cursor.node);
      previousNonCommentNode = cursor.node;
      continue;
    }

    if (
      cursor.name === ":" ||
      cursor.name === "Indent" ||
      cursor.name === "Dedent"
    ) {
      previousNonCommentNode = cursor.node;
      continue;
    }

    let blocks: Blockly.BlockSvg[];
    if (topLevel && cursor.name === "ImportStatement") {
      blocks = createImportBlocks(source, cursor.node, workspace) ?? [
        createRawBlock(source, cursor.node, workspace),
      ];
    } else if (cursor.name === "AssignStatement") {
      blocks = [
        (topLevel
          ? createHardwareBlock(source, cursor.node, workspace, resolved)
          : undefined) ??
          createVariableBlock(source, cursor.node, workspace, topLevel) ??
          createRawBlock(source, cursor.node, workspace),
      ];
    } else if (cursor.name === "PassStatement") {
      const block = workspace.newBlock("pybricks_pass");
      block.initSvg();
      block.render();
      blocks = [block];
    } else if (cursor.name === "ExpressionStatement") {
      const expressionCursor = cursor.node.cursor();
      if (!expressionCursor.firstChild()) {
        blocks = [createRawBlock(source, cursor.node, workspace)];
      } else {
        const expression = expressionCursor.node;
        const settingsBlocks = createDriveSettingsBlocks(
          source,
          expression,
          workspace,
          resolved,
        );
        if (settingsBlocks) {
          blocks = settingsBlocks;
        } else {
          const block = renderExpressionAsStatement(
            source,
            expression,
            nextConnection,
            workspace,
            resolved,
          );
          if (!block?.nextConnection) {
            throw new Error("Statement blocks must have next connections.");
          }
          nextConnection = block.nextConnection;
          lastBlock = block as Blockly.BlockSvg;
          previousNonCommentNode = cursor.node;
          continue;
        }
      }
    } else {
      blocks = [createRawBlock(source, cursor.node, workspace)];
    }

    for (const block of blocks) {
      const previousConnection = block.previousConnection;
      if (!previousConnection || !nextConnection) {
        throw new Error("Statement blocks must have previous connections.");
      }
      previousConnection.connect(nextConnection);

      if (!block.nextConnection) {
        throw new Error("Statement blocks must have next connections.");
      }
      nextConnection = block.nextConnection;
      lastBlock = block;
    }
    previousNonCommentNode = cursor.node;
  } while (cursor.nextSibling());

  for (const functionNode of functionNodes) {
    const bounds = workspace.getBlocksBoundingBox();
    const functionCursor = functionNode.cursor();
    let afterDef = false;
    let isAsync = false;
    let functionName = "";
    let parameters = "";
    let body: ParseNode | undefined;
    let functionResolved = resolved;

    if (functionCursor.firstChild()) {
      do {
        if (functionCursor.name === "async") {
          isAsync = true;
        } else if (functionCursor.name === "def") {
          afterDef = true;
        } else if (afterDef && functionCursor.name === "VariableName") {
          functionName = source.slice(
            functionCursor.node.from,
            functionCursor.node.to,
          );
          afterDef = false;
        } else if (functionCursor.name === "ParamList") {
          parameters = getParameters(source, functionCursor.node);
          functionResolved = getFunctionResolvedTable(
            source,
            functionCursor.node,
            resolved,
          );
        } else if (functionCursor.name === "Body") {
          body = functionCursor.node;
        }
      } while (functionCursor.nextSibling());
    }

    const block = workspace.newBlock(
      isAsync ? "pybricks_task" : "pybricks_function",
    );
    block.setFieldValue(functionName, "NAME");
    block.setFieldValue(parameters, "PARAMS");
    block.initSvg();
    block.render();

    const bodyConnection = block.getInput("BODY")?.connection;
    if (!body || !bodyConnection) {
      throw new Error("Function blocks must have a BODY statement input.");
    }
    renderStatements(
      source,
      body,
      bodyConnection,
      workspace,
      false,
      functionResolved,
    );
    block.render();

    const position = block.getRelativeToSurfaceXY();
    block.moveBy(40 - position.x, bounds.bottom + 32 - position.y);
  }
}

export function renderFile(
  source: string,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): void {
  const setupBlock = workspace.newBlock("pybricks_setup");
  setupBlock.initSvg();
  setupBlock.render();
  setupBlock.moveBy(40, 40);

  const tree = parser.parse(source);
  if (!setupBlock.nextConnection) {
    throw new Error("Setup block must have a next connection.");
  }
  renderStatements(
    source,
    tree.topNode,
    setupBlock.nextConnection,
    workspace,
    true,
    resolved,
  );
}
