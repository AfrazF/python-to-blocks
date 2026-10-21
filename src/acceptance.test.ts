import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { resolveProject } from "./resolve";
import { collectBlocks, type BlockDescriptor } from "./walk";

function countRaw(descriptors: BlockDescriptor[]): number {
  return descriptors.reduce((sum, descriptor) => {
    const own = descriptor.type === "pybricks_raw_code" ? 1 : 0;
    const nested = Object.values(descriptor.inputs ?? {}).flatMap(countRaw);
    return sum + own + nested.reduce((a, b) => a + b, 0);
  }, 0);
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

  expect(countRaw(collectBlocks(robot, resolved["robot.py"]))).toBe(0);
  expect(countRaw(collectBlocks(attach, resolved["exampleattach.py"]))).toBe(0);
});
