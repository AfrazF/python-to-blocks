import { expect, it } from "vitest";
import { collectBlocks, renderFile } from "./walk";

type StubBlock = {
  type: string;
  fields: Record<string, string>;
  previousConnection: { connect: (_connection: unknown) => void };
  nextConnection: { connect: (_connection: unknown) => void };
  setFieldValue: (value: string, field: string) => void;
  initSvg: () => void;
  render: () => void;
  moveBy: (_x: number, _y: number) => void;
};

it("creates a call block for a top-level expression statement", () => {
  const blocks: StubBlock[] = [];
  const workspace = {
    newBlock(type: string): StubBlock {
      const block: StubBlock = {
        type,
        fields: {},
        previousConnection: { connect: () => undefined },
        nextConnection: { connect: () => undefined },
        setFieldValue(value, field) {
          this.fields[field] = value;
        },
        initSvg: () => undefined,
        render: () => undefined,
        moveBy: () => undefined,
      };
      blocks.push(block);
      return block;
    },
  } as unknown as Parameters<typeof renderFile>[1];

  renderFile("run_task(main())", workspace, {});

  const callBlock = blocks.find((block) => block.type === "pybricks_call");
  expect(callBlock?.fields.NAME).toBe("run_task");
});

it("routes every motor run method to one block with the right mode", () => {
  const resolved = {
    motor: {
      kind: "variable" as const,
      objectKind: "Motor" as const,
      origin: "assignment" as const,
    },
  };

  const findRun = (source: string) => {
    const blocks = collectBlocks(source, resolved);
    const flat: typeof blocks = [];
    const walk = (list: typeof blocks) => {
      for (const block of list) {
        flat.push(block);
        for (const children of Object.values(block.inputs ?? {})) {
          walk(children);
        }
      }
    };
    walk(blocks);
    return flat.find((block) => block.type === "pybricks_motor_run");
  };

  expect(findRun("await motor.run_target(400, 360)")?.fields).toMatchObject({
    MODE: "towards",
    SPEED: "400",
    VALUE: "360",
  });

  expect(findRun("await motor.run_angle(500, 90)")?.fields).toMatchObject({
    MODE: "by",
    SPEED: "500",
    VALUE: "90",
  });

  expect(
    findRun("await motor.run_until_stalled(400, duty_limit=50)")?.fields,
  ).toMatchObject({
    MODE: "to end stop",
    SPEED: "400",
    VALUE: "50",
  });
});
