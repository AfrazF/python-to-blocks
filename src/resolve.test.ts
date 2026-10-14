import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { resolveProject } from "./resolve";

it("resolves imports and local names across the project", () => {
  const robot = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const exampleRun = readFileSync(
    new URL("../fixtures/examplerun.py", import.meta.url),
    "utf8",
  );
  const result = resolveProject({
    "robot.py": robot,
    "examplerun.py": exampleRun,
  });
  const resolved = result["examplerun.py"];

  console.log(resolved);

  expect(resolved.attachment_a.objectKind).toBe("Motor");
  expect(resolved.attachment_a.origin).toBe("robot.py");
  expect(resolved.drive.objectKind).toBe("DriveBase");
  expect(resolved.drive.origin).toBe("robot.py");
  expect(resolved.home.kind).toBe("async-function");
  expect(resolved.home.origin).toBe("robot.py");
  expect(resolved.reset_drive.kind).toBe("function");
  expect(resolved.reset_drive.origin).toBe("robot.py");
  expect(resolved.multitask.origin).toBe("pybricks.tools");
  expect(resolved.multitask.kind).toBeUndefined();
  expect(resolved.run1.kind).toBe("async-function");
  expect(resolved.run1.origin).toBe("local");
  expect(resolved.ATTACHMENT_A_HOME.objectKind).toBe("number");
  expect(resolved.ATTACHMENT_A_HOME.origin).toBe("local");
});
