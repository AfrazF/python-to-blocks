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

it("routes hub.light.on(Color.X) to the hub light block", () => {
  const blocks = collectBlocks("hub.light.on(Color.RED)", {});
  const light = blocks.find((block) => block.type === "pybricks_hub_light");
  expect(light?.fields).toMatchObject({ MODE: "on", COLOUR: "RED" });
  expect(light?.extraState).toEqual({ mode: "on" });
});

it("routes hub.light.off() to the hub light block with no colour", () => {
  const blocks = collectBlocks("hub.light.off()", {});
  const light = blocks.find((block) => block.type === "pybricks_hub_light");
  expect(light?.fields).toMatchObject({ MODE: "off" });
  expect(light?.fields?.COLOUR).toBeUndefined();
  expect(light?.extraState).toEqual({ mode: "off" });
});

it("falls back to raw code for an unrecognised hub light argument", () => {
  const blocks = collectBlocks("hub.light.on(x)", {});
  expect(blocks.some((block) => block.type === "pybricks_hub_light")).toBe(
    false,
  );
  expect(blocks.some((block) => block.type === "pybricks_raw_code")).toBe(true);
});

it("routes ColorSensor(Port.X) to the color sensor setup block", () => {
  const blocks = collectBlocks("line_left = ColorSensor(Port.C)", {});
  const setup = blocks.find(
    (block) => block.type === "pybricks_color_sensor_setup",
  );
  expect(setup?.fields).toMatchObject({ NAME: "line_left", PORT: "C" });
});

it("routes every color sensor read method to its reporter block", () => {
  const resolved = {
    line_left: {
      kind: "variable" as const,
      objectKind: "ColorSensor" as const,
      origin: "local" as const,
    },
  };

  const find = (source: string) =>
    collectBlocks(source, resolved).find((block) =>
      block.type.startsWith("pybricks_color_sensor_"),
    );

  expect(find("line_left.reflection()")?.type).toBe(
    "pybricks_color_sensor_reflection",
  );
  expect(find("line_left.ambient()")?.type).toBe(
    "pybricks_color_sensor_ambient",
  );

  const color = find("line_left.color()");
  expect(color?.type).toBe("pybricks_color_sensor_color");
  expect(color?.fields).toMatchObject({
    SENSOR: "line_left",
    METHOD: "color",
  });

  const hsv = find("line_left.hsv()");
  expect(hsv?.type).toBe("pybricks_color_sensor_color");
  expect(hsv?.fields).toMatchObject({ SENSOR: "line_left", METHOD: "hsv" });
});

it("falls back for a color sensor read on an untyped name", () => {
  // `sensor` is a function parameter, so it has no object kind. The read must
  // not be guessed into a color sensor block; it lands on the generic
  // method-call block instead.
  const blocks = collectBlocks("sensor.reflection()", {});
  expect(
    blocks.some((block) => block.type.startsWith("pybricks_color_sensor_")),
  ).toBe(false);
  expect(blocks.some((block) => block.type === "pybricks_method_call")).toBe(
    true,
  );
});

it('routes print("hello") to the print block with the quotes stripped', () => {
  const blocks = collectBlocks('print("hello")', {});
  const print = blocks.find((block) => block.type === "pybricks_print");
  expect(print?.fields).toMatchObject({ TEXT: "hello" });
});

it("routes print(x) to the print block with the raw expression", () => {
  const blocks = collectBlocks("print(x)", {});
  const print = blocks.find((block) => block.type === "pybricks_print");
  expect(print?.fields).toMatchObject({ TEXT: "x" });
});

it("falls through to the generic call block for print(a, b)", () => {
  // Multi-arg print is deferred. It must NOT go raw: run.py calls
  // `print("Mission error:", e)` and the acceptance test requires 0 raw blocks
  // on run.py. The generic call path keeps it as `pybricks_call NAME=print`.
  const blocks = collectBlocks("print(a, b)", {});
  expect(blocks.some((block) => block.type === "pybricks_print")).toBe(false);
  const call = blocks.find((block) => block.type === "pybricks_call");
  expect(call?.fields).toMatchObject({ NAME: "print" });
  expect(blocks.some((block) => block.type === "pybricks_raw_code")).toBe(
    false,
  );
});

it("falls through to the generic call block for print()", () => {
  const blocks = collectBlocks("print()", {});
  expect(blocks.some((block) => block.type === "pybricks_print")).toBe(false);
  const call = blocks.find((block) => block.type === "pybricks_call");
  expect(call?.fields).toMatchObject({ NAME: "print" });
  expect(blocks.some((block) => block.type === "pybricks_raw_code")).toBe(
    false,
  );
});

it("routes await wait(20) to the wait block", () => {
  const blocks = collectBlocks("await wait(20)", {});
  const wait = blocks.find((block) => block.type === "pybricks_wait");
  expect(wait?.fields).toMatchObject({ TIME: "20" });
});

it("falls back to the await wrapper for a non-numeric wait argument", () => {
  // The TIME field is a FieldNumber, which would coerce `x` to 0. The walker
  // rejects non-numeric literals, so the statement falls back to the generic
  // await wrapper around `pybricks_call NAME=wait` instead of showing a wrong
  // number. Value inputs that accept reporters arrive with v2b.2b.e.
  const blocks = collectBlocks("await wait(x)", {});
  expect(blocks.some((block) => block.type === "pybricks_wait")).toBe(false);
  const awaitBlock = blocks.find((block) => block.type === "pybricks_await");
  expect(awaitBlock?.inputs?.INNER?.[0]?.fields).toMatchObject({
    NAME: "wait",
    ARGS: "x",
  });
});

it("declares a top-level assignment as a dark-square name block", () => {
  const blocks = collectBlocks("X = 56", {});
  const declare = blocks.find((block) => block.type === "pybricks_var_declare");
  expect(declare?.fields).toMatchObject({ NAME: "X", VALUE: "56" });
  // var_declare creates a name, so it has no dropdown to populate.
  expect(declare?.extraState).toBeUndefined();
});

it("sets an in-function assignment with every resolved variable in the pill", () => {
  const resolved = {
    X: { kind: "variable" as const, origin: "assignment" as const },
    motor: {
      kind: "variable" as const,
      objectKind: "Motor" as const,
      origin: "assignment" as const,
    },
  };
  const blocks = collectBlocks("def f():\n    X = 56\n", resolved);
  const set = blocks
    .flatMap((block) => block.inputs?.BODY ?? [])
    .find((block) => block.type === "pybricks_var_set");
  expect(set?.fields).toMatchObject({ NAME: "X", VALUE: "56" });
  expect(set?.extraState).toEqual({ variables: ["X", "motor"] });
});
