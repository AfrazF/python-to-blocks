import { expect, it } from "vitest";
import { renderFile } from "./walk";

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
