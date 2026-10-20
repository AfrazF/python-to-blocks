import "./style.css";
import "./pybricks.css";
import "blockly/blocks";
import "./blocks/rawCode";
import "./blocks/setup";
import "./blocks/importBlock";
import "./blocks/task";
import "./blocks/function";
import "./blocks/call";
import "./blocks/await";
import "./blocks/multitask";
import "./blocks/driveBase";
import "./blocks/motor";
import "./blocks/variable";
import "./blocks/comment";
import "./blocks/hardware";
import robotSource from "../fixtures/robot.py?raw";
import exampleattachSource from "../fixtures/exampleattach.py?raw";
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
    "exampleattach.py": exampleattachSource,
  });
  renderFile(exampleattachSource, workspace, resolved["exampleattach.py"]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWorkspace, { once: true });
} else {
  startWorkspace();
}
