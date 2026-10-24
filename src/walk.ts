import * as Blockly from "blockly";
import { parser } from "@lezer/python";
import type { ResolvedTable } from "./resolve";

// Re-exported so tests can parse fixtures without importing @lezer directly.
export { parser };

type ParseNode = ReturnType<typeof parser.parse>["topNode"];

/** One argument of a call, with the source range it came from. */
type Argument = { text: string; start: number; end: number };

/** One comment, with the source range it came from. */
type CommentSpan = { text: string; from: number; to: number };

/**
 * A block that has not been built yet. `collectBlocks` produces these, then
 * `materialize` turns them into real Blockly blocks. Splitting the walk from
 * the rendering lets every block remember the source range it came from.
 */
export interface BlockDescriptor {
  type: string;
  fields?: Record<string, string>;
  inputs?: Record<string, BlockDescriptor[]>;
  sourceStart: number;
  sourceEnd: number;
  /** Whole-statement range, used as a fallback for import blocks. */
  statementStart?: number;
  statementEnd?: number;
  commentText?: string;
  /** Source range of the comment text, set whenever `commentText` is set. */
  commentSourceStart?: number;
  commentSourceEnd?: number;
  taskCount?: number;
}

/** The block that owns a body: it receives the body's docstring. */
type ParentBlockInfo = {
  topLevel: boolean;
  block?: BlockDescriptor;
};

/** A block that remembers where in the Python file it came from. */
type BlockWithSourceRange = Blockly.Block & {
  sourceStart: number;
  sourceEnd: number;
  statementStart?: number;
  statementEnd?: number;
  commentSourceStart?: number;
  commentSourceEnd?: number;
};

/** What one body contains: statements to chain, plus functions to float. */
type CollectedBody = {
  statements: BlockDescriptor[];
  functions: BlockDescriptor[];
};

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

function rawDescriptor(source: string, node: ParseNode): BlockDescriptor {
  return {
    type: "pybricks_raw_code",
    fields: { CODE: source.slice(node.from, node.to) },
    sourceStart: node.from,
    sourceEnd: node.to,
  };
}

function collectVariableBlock(
  source: string,
  node: ParseNode,
  topLevel: boolean,
): BlockDescriptor | undefined {
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

  return {
    type: topLevel ? "pybricks_var_declare" : "pybricks_var_set",
    fields: {
      NAME: source.slice(variableName.from, variableName.to),
      VALUE: source.slice(value.from, value.to),
    },
    sourceStart: node.from,
    sourceEnd: node.to,
  };
}

function collectHardwareBlock(
  source: string,
  node: ParseNode,
  resolved: ResolvedTable,
): BlockDescriptor | undefined {
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

  const call = readCallExpression(rightHandSide);
  if (!call || call.callee.type.name !== "VariableName") {
    return undefined;
  }

  const target = source.slice(targetName.from, targetName.to);
  const constructor = source.slice(call.callee.from, call.callee.to);
  const positional = getCallArgumentValues(
    source,
    call.argumentList,
  ).positional;
  let type: string;
  let fields: Record<string, string>;
  let driveBaseArguments: Argument[] | undefined;

  if (constructor === "PrimeHub") {
    type = "pybricks_hub";
    fields = { NAME: target };
  } else if (constructor === "Motor") {
    type = "pybricks_motor_setup";
    fields = {
      NAME: target,
      PORT: positional[0]?.text.replace(/^Port\./, "") ?? "A",
      DIRECTION:
        positional[1]?.text.replace(/^Direction\./, "").toLowerCase() ??
        "clockwise",
    };
  } else if (constructor === "DriveBase") {
    type = "pybricks_drivebase_setup";
    fields = { NAME: target };
    driveBaseArguments = positional;
  } else {
    return undefined;
  }

  const descriptor: BlockDescriptor = {
    type,
    fields,
    sourceStart: node.from,
    sourceEnd: node.to,
  };

  if (driveBaseArguments) {
    ["LEFT", "RIGHT", "WHEEL", "TRACK"].forEach((inputName, index) => {
      applyArgument(
        descriptor,
        inputName,
        driveBaseArguments?.[index],
        resolved,
      );
    });
  }
  return descriptor;
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
): { positional: Argument[]; keywords: Record<string, Argument> } {
  const positional: Argument[] = [];
  const keywords: Record<string, Argument> = {};
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
        const rawValue = source.slice(assignment.to, end);
        const leadingSpace = rawValue.length - rawValue.trimStart().length;
        keywords[keyword] = {
          text: rawValue.trim(),
          start: assignment.to + leadingSpace,
          end,
        };
      }
    } else {
      positional.push({ text: source.slice(start, end).trim(), start, end });
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

/**
 * Fills one value input of a descriptor. A known variable becomes a reporter
 * chip; anything else is kept as raw text for the input's shadow block.
 */
function applyArgument(
  descriptor: BlockDescriptor,
  inputName: string,
  argument: Argument | undefined,
  resolved: ResolvedTable,
  fallback?: string,
): void {
  const text = argument?.text.trim() ?? fallback;
  if (text === undefined) {
    return;
  }

  const entry = resolved[text];
  if (entry && (entry.kind === "variable" || entry.objectKind)) {
    descriptor.inputs ??= {};
    descriptor.inputs[inputName] = [
      {
        type: "pybricks_var_reporter",
        fields: { NAME: text },
        sourceStart: argument?.start ?? descriptor.sourceStart,
        sourceEnd: argument?.end ?? descriptor.sourceEnd,
      },
    ];
    return;
  }

  descriptor.fields ??= {};
  descriptor.fields[inputName] = text;
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

function collectMotorBlock(
  type: string,
  fields: Record<string, string>,
  args: Record<string, Argument | undefined>,
  resolved: ResolvedTable,
  node: ParseNode,
): BlockDescriptor {
  const descriptor: BlockDescriptor = {
    type,
    fields: { ...fields },
    sourceStart: node.from,
    sourceEnd: node.to,
  };
  for (const [inputName, argument] of Object.entries(args)) {
    applyArgument(descriptor, inputName, argument, resolved, "0");
  }
  return descriptor;
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
      } else if (!callee) {
        callee = cursor.node;
      }
    } while (cursor.nextSibling());
  }

  return callee && argumentList ? { callee, argumentList } : undefined;
}

/** Drops the leading `#` from every line of a comment node. */
function stripComment(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^# ?/, ""))
    .join("\n");
}

/**
 * Splits the comments inside `multitask(...)` by the argument they describe.
 *
 * Lezer flattens an argument list to `( Comment arg , Comment arg , Comment )`,
 * so a comment that follows argument N belongs to argument N, while anything
 * before the first argument describes the whole call. Keyword arguments span
 * several nodes (`race` `=` `True`), so "is this a new argument?" is decided by
 * matching the child's start offset against the positional argument nodes.
 */
function getMultitaskComments(
  source: string,
  argumentList: ParseNode,
  argumentNodes: ParseNode[],
): { multitask: CommentSpan[]; perArg: CommentSpan[][] } {
  const multitask: CommentSpan[] = [];
  const perArg: CommentSpan[][] = argumentNodes.map(() => []);
  const argumentStarts = argumentNodes.map((node) => node.from);
  let argsSeen = 0;

  const cursor = argumentList.cursor();
  if (!cursor.firstChild()) {
    return { multitask, perArg };
  }

  do {
    if (cursor.name === "Comment") {
      const span: CommentSpan = {
        text: stripComment(source.slice(cursor.node.from, cursor.node.to)),
        from: cursor.node.from,
        to: cursor.node.to,
      };
      if (argsSeen === 0) {
        multitask.push(span);
      } else {
        perArg[argsSeen - 1].push(span);
      }
      continue;
    }

    // Keyword arguments are not in argumentNodes, so they do not count here.
    if (argumentStarts.includes(cursor.from)) {
      argsSeen += 1;
    }
  } while (cursor.nextSibling());

  return { multitask, perArg };
}

/** Returns the expression inside `await ...`. */
function readAwaitInner(node: ParseNode): ParseNode | undefined {
  const cursor = node.cursor();
  if (!cursor.firstChild()) {
    return undefined;
  }
  do {
    if (cursor.name !== "await") {
      return cursor.node;
    }
  } while (cursor.nextSibling());
  return undefined;
}

/** Reads `object.member` into its two names. */
function readMember(
  source: string,
  node: ParseNode,
): { objectName?: string; memberName?: string } {
  const cursor = node.cursor();
  let objectName: string | undefined;
  let memberName: string | undefined;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "VariableName" && objectName === undefined) {
        objectName = source.slice(cursor.node.from, cursor.node.to);
      } else if (cursor.name === "PropertyName") {
        memberName = source.slice(cursor.node.from, cursor.node.to);
      }
    } while (cursor.nextSibling());
  }

  return { objectName, memberName };
}

function collectDriveSettingsBlocks(
  source: string,
  expression: ParseNode,
  resolved: ResolvedTable,
): BlockDescriptor[] | undefined {
  const call = readCallExpression(expression);
  if (!call || call.callee.type.name !== "MemberExpression") {
    return undefined;
  }

  const { objectName, memberName } = readMember(source, call.callee);
  if (
    !objectName ||
    memberName !== "settings" ||
    resolved[objectName]?.objectKind !== "DriveBase"
  ) {
    return undefined;
  }

  const { keywords } = getCallArgumentValues(source, call.argumentList);
  const whatByKeyword: Record<string, string> = {
    straight_speed: "drive speed",
    straight_acceleration: "drive acceleration",
    turn_rate: "turn speed",
    turn_acceleration: "turn acceleration",
  };

  return Object.entries(keywords).flatMap(([keyword, argument]) => {
    const what = whatByKeyword[keyword];
    if (!what) {
      return [];
    }

    const descriptor: BlockDescriptor = {
      type: "pybricks_drive_configure",
      fields: { WHAT: what },
      sourceStart: expression.from,
      sourceEnd: expression.to,
    };
    applyArgument(descriptor, "VALUE", argument, resolved);
    return [descriptor];
  });
}

function collectExpression(
  source: string,
  expression: ParseNode,
  resolved: ResolvedTable,
): BlockDescriptor {
  if (expression.type.name === "AwaitExpression") {
    const innerExpression = readAwaitInner(expression);
    if (!innerExpression) {
      throw new Error("Await expressions must have an inner expression.");
    }
    return {
      type: "pybricks_await",
      inputs: {
        INNER: [collectExpression(source, innerExpression, resolved)],
      },
      sourceStart: expression.from,
      sourceEnd: expression.to,
    };
  }

  if (expression.type.name === "CallExpression") {
    const call = readCallExpression(expression);

    if (call?.callee.type.name === "VariableName") {
      return {
        type: "pybricks_call",
        fields: {
          NAME: source.slice(call.callee.from, call.callee.to),
          ARGS: getCallArguments(source, call.argumentList),
        },
        sourceStart: expression.from,
        sourceEnd: expression.to,
      };
    }

    if (call?.callee.type.name === "MemberExpression") {
      const { objectName, memberName } = readMember(source, call.callee);

      if (
        objectName &&
        memberName &&
        resolved[objectName]?.objectKind === "DriveBase"
      ) {
        const { positional, keywords } = getCallArgumentValues(
          source,
          call.argumentList,
        );

        if (memberName === "straight" || memberName === "turn") {
          const thenText = keywords.then?.text ?? "";
          const thenValue = /^Stop\.(COAST|BRAKE|HOLD)$/.test(thenText)
            ? thenText.slice("Stop.".length).toLowerCase()
            : "hold";
          const descriptor: BlockDescriptor = {
            type: "pybricks_drive_move",
            fields: { MODE: memberName, THEN: thenValue },
            sourceStart: expression.from,
            sourceEnd: expression.to,
          };
          applyArgument(descriptor, "AMOUNT", positional[0], resolved, "0");
          return descriptor;
        }

        if (memberName === "reset") {
          const descriptor: BlockDescriptor = {
            type: "pybricks_drive_reset",
            sourceStart: expression.from,
            sourceEnd: expression.to,
          };
          applyArgument(
            descriptor,
            "DISTANCE",
            keywords.distance ?? positional[0],
            resolved,
            "0",
          );
          applyArgument(
            descriptor,
            "ANGLE",
            keywords.angle ?? positional[1],
            resolved,
            "0",
          );
          return descriptor;
        }

        if (memberName === "use_gyro") {
          const value = positional[0]?.text ?? keywords.value?.text;
          return {
            type: "pybricks_drive_use_gyro",
            fields: { VALUE: value === "True" ? "gyro" : "no gyro" },
            sourceStart: expression.from,
            sourceEnd: expression.to,
          };
        }
      }

      if (
        objectName &&
        memberName &&
        resolved[objectName]?.objectKind === "Motor"
      ) {
        const { positional, keywords } = getCallArgumentValues(
          source,
          call.argumentList,
        );
        const motor = objectName;

        if (memberName === "run_target") {
          return collectMotorBlock(
            "pybricks_motor_run_target",
            { MOTOR: motor, THEN: getThenMode(keywords.then?.text, "hold") },
            { SPEED: positional[0], TARGET: positional[1] },
            resolved,
            expression,
          );
        }

        if (memberName === "run_angle") {
          return collectMotorBlock(
            "pybricks_motor_run_angle",
            { MOTOR: motor, THEN: getThenMode(keywords.then?.text, "hold") },
            { SPEED: positional[0], ANGLE: positional[1] },
            resolved,
            expression,
          );
        }

        if (memberName === "run_until_stalled") {
          return collectMotorBlock(
            "pybricks_motor_run_until_stalled",
            {
              MOTOR: motor,
              THEN: getThenMode(
                keywords.then?.text ?? positional[1]?.text,
                "hold",
              ),
            },
            {
              SPEED: positional[0],
              DUTY: keywords.duty_limit ?? positional[2],
            },
            resolved,
            expression,
          );
        }

        if (memberName === "reset_angle") {
          return collectMotorBlock(
            "pybricks_motor_reset_angle",
            { MOTOR: motor },
            { VALUE: positional[0] },
            resolved,
            expression,
          );
        }

        if (memberName === "stop") {
          return collectMotorBlock(
            "pybricks_motor_stop",
            {
              MOTOR: motor,
              MODE: getThenMode(
                keywords.mode?.text ?? positional[0]?.text,
                "coast",
              ),
            },
            {},
            resolved,
            expression,
          );
        }
      }

      if (objectName && memberName) {
        return {
          type: "pybricks_method_call",
          fields: {
            OBJ: objectName,
            METHOD: memberName,
            ARGS: getCallArguments(source, call.argumentList),
          },
          sourceStart: expression.from,
          sourceEnd: expression.to,
        };
      }
    }
  }

  return rawDescriptor(source, expression);
}

/** Turns one expression statement into a descriptor, expanding `multitask`. */
function collectExpressionStatement(
  source: string,
  expression: ParseNode,
  resolved: ResolvedTable,
): BlockDescriptor {
  if (expression.type.name === "AwaitExpression") {
    const innerExpression = readAwaitInner(expression);
    const call = innerExpression
      ? readCallExpression(innerExpression)
      : undefined;

    if (
      innerExpression &&
      call?.callee.type.name === "VariableName" &&
      source.slice(call.callee.from, call.callee.to) === "multitask"
    ) {
      const argumentNodes = getCallArgumentNodes(call.argumentList);
      const { keywords } = getCallArgumentValues(source, call.argumentList);
      const descriptor: BlockDescriptor = {
        type: "pybricks_multitask",
        fields: { MODE: keywords.race?.text === "True" ? "any" : "all" },
        inputs: {},
        taskCount: Math.max(1, argumentNodes.length),
        sourceStart: expression.from,
        sourceEnd: expression.to,
      };

      // Build each argument once, then hand the same descriptor to the comment
      // pass and to the TASK inputs, so the comment lands on the block that
      // actually renders inside the slot.
      const argumentDescriptors = argumentNodes.map((argument) =>
        collectExpressionStatement(source, argument, resolved),
      );

      const { multitask, perArg } = getMultitaskComments(
        source,
        call.argumentList,
        argumentNodes,
      );

      if (multitask.length > 0) {
        descriptor.commentText = multitask.map((span) => span.text).join("\n");
        descriptor.commentSourceStart = multitask[0].from;
        descriptor.commentSourceEnd = multitask.at(-1)!.to;
      }

      argumentDescriptors.forEach((argumentDescriptor, index) => {
        const comments = perArg[index];
        if (comments.length > 0) {
          argumentDescriptor.commentText = comments
            .map((span) => span.text)
            .join("\n");
          argumentDescriptor.commentSourceStart = comments[0].from;
          argumentDescriptor.commentSourceEnd = comments.at(-1)!.to;
        }
        descriptor.inputs![`TASK${index}`] = [argumentDescriptor];
      });
      return descriptor;
    }
  }

  return collectExpression(source, expression, resolved);
}

type ImportBinding = {
  name: string;
  alias?: string;
  /** Source range of just this name (and its alias, if any). */
  from: number;
  to: number;
};

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
          // The alias extends the range to cover `name as alias`.
          lastBinding.to = cursor.node.to;
          expectingAlias = false;
        } else {
          bindings.push({
            name,
            from: cursor.node.from,
            to: cursor.node.to,
          });
        }
      }
    } while (cursor.nextSibling());
  }

  if (moduleParts.length === 0 || bindings.length === 0) {
    return undefined;
  }

  return { moduleName: moduleParts.join("."), bindings };
}

function collectImportBlocks(
  source: string,
  node: ParseNode,
): BlockDescriptor[] | undefined {
  const parsedImport = readFromImport(source, node);
  if (!parsedImport) {
    return undefined;
  }

  return parsedImport.bindings.map((binding) => ({
    type: binding.alias ? "pybricks_import_as" : "pybricks_import",
    fields: {
      MODULE: parsedImport.moduleName,
      NAME: binding.name,
      ...(binding.alias ? { ALIAS: binding.alias } : {}),
    },
    // Each block points at its own name (plus alias), not the whole statement.
    sourceStart: binding.from,
    sourceEnd: binding.to,
    // Fallback range: the whole `from ... import ...` statement.
    statementStart: node.from,
    statementEnd: node.to,
  }));
}

function collectFunctionBlock(
  source: string,
  functionNode: ParseNode,
  resolved: ResolvedTable,
): BlockDescriptor {
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

  if (!body) {
    throw new Error("Function definitions must have a body.");
  }

  const descriptor: BlockDescriptor = {
    type: isAsync ? "pybricks_task" : "pybricks_function",
    fields: { NAME: functionName, PARAMS: parameters },
    sourceStart: functionNode.from,
    sourceEnd: functionNode.to,
  };

  const collected = collectBody(source, body, functionResolved, {
    topLevel: false,
    block: descriptor,
  });
  descriptor.inputs = { BODY: collected.statements };
  return descriptor;
}

/**
 * Reads `for <loop var> in <iterable>:` into a C-shaped block.
 *
 * The loop variable and the iterable are kept as raw source text: tuple forms
 * (`i, mission`) and calls (`enumerate(missions)`) both survive verbatim.
 * A `for ... else:` has no block shape yet, so it returns undefined and the
 * caller falls back to a raw-code block.
 */
function collectForBlock(
  source: string,
  node: ParseNode,
  resolved: ResolvedTable,
): { descriptor: BlockDescriptor; functions: BlockDescriptor[] } | undefined {
  const cursor = node.cursor();
  let forTokenEnd: number | undefined;
  let inToken: ParseNode | undefined;
  let body: ParseNode | undefined;
  let hasElse = false;

  if (cursor.firstChild()) {
    do {
      if (cursor.name === "for" && forTokenEnd === undefined) {
        forTokenEnd = cursor.node.to;
      } else if (cursor.name === "in" && inToken === undefined) {
        inToken = cursor.node;
      } else if (cursor.name === "Body" && body === undefined) {
        body = cursor.node;
      } else if (cursor.name === "else") {
        hasElse = true;
      }
    } while (cursor.nextSibling());
  }

  if (forTokenEnd === undefined || !inToken || !body || hasElse) {
    return undefined;
  }

  const descriptor: BlockDescriptor = {
    type: "pybricks_for",
    fields: {
      LOOP_VAR: source.slice(forTokenEnd, inToken.from).trim(),
      ITERABLE: source.slice(inToken.to, body.from).trim(),
    },
    inputs: {},
    sourceStart: node.from,
    sourceEnd: node.to,
  };

  const collected = collectBody(source, body, resolved, {
    topLevel: false,
    block: descriptor,
  });
  descriptor.inputs = { BODY: collected.statements };
  return { descriptor, functions: collected.functions };
}

/**
 * Walks one body (the whole file, or a function body) and returns the
 * statements to chain plus any functions, which float on their own.
 */
function collectBody(
  source: string,
  node: ParseNode,
  resolved: ResolvedTable,
  parent: ParentBlockInfo,
): CollectedBody {
  const statements: BlockDescriptor[] = [];
  const functions: BlockDescriptor[] = [];
  const cursor = node.cursor();
  let previousNonCommentNode: ParseNode | undefined;
  let docstringConsumed = false;

  if (!cursor.firstChild()) {
    return { statements, functions };
  }

  do {
    if (cursor.name === "Comment") {
      const commentNode = cursor.node;
      // Compound statements (`for`, `while`, `if`, `try`) end at the newline
      // that closes their last line, so the gap to a following comment is
      // empty even though the comment sits on its own line. Treat a previous
      // node that already ends in a newline as "the comment is below it".
      const previousText =
        previousNonCommentNode === undefined
          ? ""
          : source.slice(
              previousNonCommentNode.from,
              previousNonCommentNode.to,
            );
      const isStandalone =
        previousNonCommentNode === undefined ||
        previousText.endsWith("\n") ||
        source
          .slice(previousNonCommentNode.to, commentNode.from)
          .includes("\n");
      const commentText = source.slice(commentNode.from, commentNode.to);

      if (!isStandalone && statements.length > 0) {
        const target = statements.at(-1)!;
        target.commentText = commentText.replace(/^# ?/, "");
        target.commentSourceStart = commentNode.from;
        target.commentSourceEnd = commentNode.to;
        continue;
      }

      statements.push({
        type: "pybricks_comment",
        fields: { TEXT: commentText },
        sourceStart: commentNode.from,
        sourceEnd: commentNode.to,
      });
      continue;
    }

    if (parent.topLevel && cursor.name === "FunctionDefinition") {
      docstringConsumed = true;
      functions.push(collectFunctionBlock(source, cursor.node, resolved));
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

    if (!docstringConsumed && cursor.name === "ExpressionStatement") {
      const expressionCursor = cursor.node.cursor();
      if (
        expressionCursor.firstChild() &&
        expressionCursor.name === "String" &&
        !expressionCursor.nextSibling()
      ) {
        const raw = source.slice(cursor.node.from, cursor.node.to);
        const stripped = raw.replace(/^['"]{3}|['"]{3}$/g, "").trim();
        if (parent.block) {
          parent.block.commentText = stripped;
          parent.block.commentSourceStart = cursor.node.from;
          parent.block.commentSourceEnd = cursor.node.to;
        }
        docstringConsumed = true;
        previousNonCommentNode = cursor.node;
        continue;
      }
    }

    docstringConsumed = true;
    let blocks: BlockDescriptor[];
    if (parent.topLevel && cursor.name === "ImportStatement") {
      blocks = collectImportBlocks(source, cursor.node) ?? [
        rawDescriptor(source, cursor.node),
      ];
    } else if (cursor.name === "AssignStatement") {
      blocks = [
        (parent.topLevel
          ? collectHardwareBlock(source, cursor.node, resolved)
          : undefined) ??
          collectVariableBlock(source, cursor.node, parent.topLevel) ??
          rawDescriptor(source, cursor.node),
      ];
    } else if (cursor.name === "PassStatement") {
      blocks = [
        {
          type: "pybricks_pass",
          sourceStart: cursor.node.from,
          sourceEnd: cursor.node.to,
        },
      ];
    } else if (cursor.name === "ExpressionStatement") {
      const expressionCursor = cursor.node.cursor();
      if (!expressionCursor.firstChild()) {
        blocks = [rawDescriptor(source, cursor.node)];
      } else {
        const expression = expressionCursor.node;
        blocks = collectDriveSettingsBlocks(source, expression, resolved) ?? [
          collectExpressionStatement(source, expression, resolved),
        ];
      }
    } else if (cursor.name === "ForStatement") {
      const collectedFor = collectForBlock(source, cursor.node, resolved);
      if (collectedFor) {
        blocks = [collectedFor.descriptor];
        functions.push(...collectedFor.functions);
      } else {
        blocks = [rawDescriptor(source, cursor.node)];
      }
    } else {
      blocks = [rawDescriptor(source, cursor.node)];
    }

    statements.push(...blocks);
    previousNonCommentNode = cursor.node;
  } while (cursor.nextSibling());

  return { statements, functions };
}

/**
 * Walks the whole file and returns the `set up` hat, the statements below it,
 * and the function blocks that float beside it.
 */
export function collectBlocks(
  source: string,
  resolved: ResolvedTable,
): BlockDescriptor[] {
  const tree = parser.parse(source);
  const setup: BlockDescriptor = {
    type: "pybricks_setup",
    sourceStart: 0,
    sourceEnd: source.length,
  };
  const body = collectBody(source, tree.topNode, resolved, {
    topLevel: true,
    block: setup,
  });
  return [setup, ...body.statements, ...body.functions];
}

/**
 * Sets a field, or the shadow block inside a value input. Literal arguments
 * live in `fields` under the input's name, so they land on the shadow.
 */
function applyFieldValue(
  block: Blockly.Block,
  name: string,
  value: string,
): void {
  const getField = (block as Partial<Blockly.Block>).getField;
  if (typeof getField !== "function") {
    // Test stubs implement only setFieldValue.
    block.setFieldValue(value, name);
    return;
  }

  if (getField.call(block, name)) {
    block.setFieldValue(value, name);
    return;
  }

  const shadow = block.getInput(name)?.connection?.targetBlock();
  if (shadow?.type === "math_number") {
    shadow.setFieldValue(value, "NUM");
  }
}

function createBlock(
  descriptor: BlockDescriptor,
  workspace: Blockly.WorkspaceSvg,
): Blockly.BlockSvg {
  const block = workspace.newBlock(descriptor.type);

  for (const [name, value] of Object.entries(descriptor.fields ?? {})) {
    applyFieldValue(block, name, value);
  }

  // The mutator must add its task slots before we look for them.
  if (descriptor.taskCount !== undefined) {
    (
      block as Blockly.Block & {
        loadExtraState: (state: { taskCount: number }) => void;
      }
    ).loadExtraState({ taskCount: descriptor.taskCount });

    // The slots are already built, so the gear icon has nothing left to do.
    // Removing it lets the comment icon own the top-left corner instead.
    // Blockly 13 has no setVisible(); removeIcon() disposes the icon and
    // clears block.mutator (block_svg.js).
    block.removeIcon(Blockly.icons.IconType.MUTATOR);
  }

  block.initSvg();
  block.render();

  if (descriptor.commentText !== undefined) {
    block.setCommentText?.(descriptor.commentText);
  }

  const ranged = block as Blockly.BlockSvg & Partial<BlockWithSourceRange>;
  ranged.sourceStart = descriptor.sourceStart;
  ranged.sourceEnd = descriptor.sourceEnd;
  if (
    descriptor.statementStart !== undefined &&
    descriptor.statementEnd !== undefined
  ) {
    ranged.statementStart = descriptor.statementStart;
    ranged.statementEnd = descriptor.statementEnd;
  }
  if (
    descriptor.commentSourceStart !== undefined &&
    descriptor.commentSourceEnd !== undefined
  ) {
    ranged.commentSourceStart = descriptor.commentSourceStart;
    ranged.commentSourceEnd = descriptor.commentSourceEnd;
  }
  return block;
}

/** Places a block that has nothing above it: the hat, or a function. */
function placeRootBlock(
  block: Blockly.BlockSvg,
  descriptor: BlockDescriptor,
  bounds: Blockly.utils.Rect | null,
): void {
  if (descriptor.type === "pybricks_setup") {
    block.moveBy(40, 40);
    return;
  }

  const position = block.getRelativeToSurfaceXY?.();
  if (!bounds || !position) {
    return;
  }
  block.moveBy(40 - position.x, bounds.bottom + 32 - position.y);
}

function materializeInputs(
  block: Blockly.BlockSvg,
  descriptor: BlockDescriptor,
  workspace: Blockly.WorkspaceSvg,
): void {
  for (const [inputName, children] of Object.entries(descriptor.inputs ?? {})) {
    const input = block.getInput?.(inputName);
    if (!input?.connection) {
      throw new Error(
        `Block ${descriptor.type} has no input named ${inputName}.`,
      );
    }

    if (input.connection.type === Blockly.ConnectionType.INPUT_VALUE) {
      const child = children[0];
      if (!child) {
        continue;
      }
      const childBlock = createBlock(child, workspace);
      if (!childBlock.outputConnection) {
        throw new Error(`Value block ${child.type} needs an output.`);
      }
      childBlock.outputConnection.connect(input.connection);
      materializeInputs(childBlock, child, workspace);
      childBlock.render();
      continue;
    }

    materialize(children, workspace, input.connection);
  }
}

/**
 * Turns descriptors into real blocks. Statements chain downwards; blocks with
 * no previous connection (the hat, functions) are placed on their own.
 */
function materialize(
  descriptors: BlockDescriptor[],
  workspace: Blockly.WorkspaceSvg,
  parentConnection: Blockly.Connection | null,
): void {
  let connection = parentConnection;

  for (const descriptor of descriptors) {
    // Measure before creating the block, so a function lands below what is
    // already on the workspace rather than below itself.
    const bounds = workspace.getBlocksBoundingBox?.() ?? null;
    const block = createBlock(descriptor, workspace);

    if (connection && block.previousConnection) {
      block.previousConnection.connect(connection);
      connection = block.nextConnection ?? null;
    } else {
      placeRootBlock(block, descriptor, bounds);
      // The hat starts the top-level chain; functions stay on their own.
      if (descriptor.type === "pybricks_setup") {
        connection = block.nextConnection ?? null;
      }
    }

    materializeInputs(block, descriptor, workspace);
    block.render();
  }
}

export function renderFile(
  source: string,
  workspace: Blockly.WorkspaceSvg,
  resolved: ResolvedTable,
): void {
  const descriptors = collectBlocks(source, resolved);
  materialize(descriptors, workspace, null);
}
