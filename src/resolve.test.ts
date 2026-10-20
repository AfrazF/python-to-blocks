import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { resolveProject } from "./resolve";

it("resolves imports and local names across the project", () => {
  const robot = readFileSync(
    new URL("../fixtures/robot.py", import.meta.url),
    "utf8",
  );
  const run = readFileSync(
    new URL("../fixtures/run.py", import.meta.url),
    "utf8",
  );
  const exampleAttach = readFileSync(
    new URL("../fixtures/exampleattach.py", import.meta.url),
    "utf8",
  );
  const result = resolveProject({
    "robot.py": robot,
    "run.py": run,
    "exampleattach.py": exampleAttach,
  });
  const resolved = result["exampleattach.py"];

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
  expect(resolved.run_missions.kind).toBe("async-function");
  expect(resolved.run_missions.origin).toBe("run.py");
  expect(resolved.mission1.kind).toBe("async-function");
  expect(resolved.mission1.origin).toBe("local");
  expect(resolved.HOME_A.objectKind).toBe("number");
  expect(resolved.HOME_A.origin).toBe("local");
  expect(resolved.ACTIVE_A.objectKind).toBe("number");
  expect(resolved.ACTIVE_A.origin).toBe("local");
});
