import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { buildObjectTable } from "./objects";
import { buildSymbolTable } from "./symbols";

it("builds the symbol table from robot.py", () => {
  const source = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const symbols = buildSymbolTable(source);

  console.log(symbols);

  for (const name of [
    "drive",
    "attachment1",
    "attachment2",
    "hub",
    "left",
    "right",
    "WHEEL_DIAMETER",
    "AXLE_TRACK",
    "normal",
    "fast",
    "precise",
    "reset_drive",
    "home",
  ]) {
    expect(symbols).toHaveProperty(name);
  }

  expect(symbols.home.kind).toBe("async-function");
  expect(symbols.reset_drive.kind).toBe("function");
});

it("builds the object table from robot.py", () => {
  const source = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const objects = buildObjectTable(source);

  console.log(objects);

  expect(objects.drive.objectKind).toBe("DriveBase");
  expect(objects.attachment1.objectKind).toBe("Motor");
  expect(objects.attachment2.objectKind).toBe("Motor");
  expect(objects.hub.objectKind).toBe("PrimeHub");
  expect(objects.WHEEL_DIAMETER.objectKind).toBe("number");
  expect(objects.AXLE_TRACK.objectKind).toBe("number");
});
