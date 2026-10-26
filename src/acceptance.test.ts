import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { resolveProject } from "./resolve";
import { collectBlocks, type BlockDescriptor } from "./walk";

// Current counts, NOT the v1.5 target. The v1.5 goal is 0 for every
// fixture; these numbers are a regression guard only. Lower in the same
// PR when a later step reduces the count. Never raise.
const BASELINE_MAIN = 7;
const BASELINE_RUN = 4;

function countRaw(descriptors: BlockDescriptor[]): number {
  return descriptors.reduce((sum, descriptor) => {
    const own = descriptor.type === "pybricks_raw_code" ? 1 : 0;
    const nested = Object.values(descriptor.inputs ?? {}).flatMap(countRaw);
    return sum + own + nested.reduce((a, b) => a + b, 0);
  }, 0);
}

/** Every raw block in the tree, in walk order, with its source range. */
function collectRawBlocks(descriptors: BlockDescriptor[]): BlockDescriptor[] {
  return descriptors.reduce<BlockDescriptor[]>((found, descriptor) => {
    if (descriptor.type === "pybricks_raw_code") {
      found.push(descriptor);
    }
    for (const children of Object.values(descriptor.inputs ?? {})) {
      found.push(...collectRawBlocks(children));
    }
    return found;
  }, []);
}

const SNIPPET_LENGTH = 40;

function lineNumberAt(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}

type FixtureRawReport = {
  filename: string;
  source: string;
  blocks: BlockDescriptor[];
};

/** Logs one line per raw block, grouped per file and sorted by line. */
function reportRawBlocks(fixtures: FixtureRawReport[]): void {
  const counts: string[] = [];

  for (const { filename, source, blocks } of fixtures) {
    const raws = collectRawBlocks(blocks).sort(
      (a, b) => a.sourceStart - b.sourceStart,
    );

    counts.push(`${filename}: ${raws.length}`);

    for (const raw of raws) {
      const snippet = source
        .slice(raw.sourceStart, raw.sourceStart + SNIPPET_LENGTH)
        .replaceAll("\n", " ");
      console.log(
        `${filename}:${lineNumberAt(source, raw.sourceStart)} ${snippet}`,
      );
    }
  }

  console.log(`raw block totals — ${counts.join(", ")}`);
}

it("fixtures stay at or below their raw block baseline", () => {
  const robot = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const attach = readFileSync(
    new URL("../fixtures/exampleattach.py", import.meta.url),
    "utf8",
  );
  const main = readFileSync(
    new URL("../fixtures/main.py", import.meta.url),
    "utf8",
  );
  const run = readFileSync(
    new URL("../fixtures/run.py", import.meta.url),
    "utf8",
  );
  const resolved = resolveProject({
    "robot.py": robot,
    "exampleattach.py": attach,
    "main.py": main,
    "run.py": run,
  });

  const robotBlocks = collectBlocks(robot, resolved["robot.py"]);
  const attachBlocks = collectBlocks(attach, resolved["exampleattach.py"]);
  const mainBlocks = collectBlocks(main, resolved["main.py"]);
  const runBlocks = collectBlocks(run, resolved["run.py"]);

  reportRawBlocks([
    { filename: "robot.py", source: robot, blocks: robotBlocks },
    { filename: "exampleattach.py", source: attach, blocks: attachBlocks },
    { filename: "main.py", source: main, blocks: mainBlocks },
    { filename: "run.py", source: run, blocks: runBlocks },
  ]);

  expect(countRaw(robotBlocks)).toBe(0);
  expect(countRaw(attachBlocks)).toBe(0);
  expect(countRaw(mainBlocks)).toBeLessThanOrEqual(BASELINE_MAIN);
  expect(countRaw(runBlocks)).toBeLessThanOrEqual(BASELINE_RUN);
});
