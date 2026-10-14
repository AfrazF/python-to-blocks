import "./style.css";
import "./pybricks.css";
import "./blocks/rawCode";
import "./blocks/setup";
import "./blocks/importBlock";
import "./blocks/task";
import "./blocks/function";
import "./blocks/call";
import "./blocks/await";
import "./blocks/driveBase";
import "./blocks/motor";
import "./blocks/variable";
import "./blocks/comment";
import robotSource from "../fixtures/robot.py?raw";
import examplerunSource from "../fixtures/examplerun.py?raw";
import { createWorkspace } from "./blockly";
import { resolveProject } from "./resolve";
import { renderFile } from "./walk";

function startWorkspace(): void {
  const container = document.querySelector<HTMLElement>("#blockly");
  if (!container) {
    throw new Error("Blockly container #blockly was not found.");
  }
  const workspace = createWorkspace(container);
  const resolved = resolveProject({
    "robot.py": robotSource,
    "examplerun.py": examplerunSource,
  });
  renderFile(robotSource, workspace, resolved["robot.py"]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWorkspace, { once: true });
} else {
  startWorkspace();
}
