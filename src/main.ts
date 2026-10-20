import * as Blockly from "blockly";
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
import "./blocks/pass";
import "./blocks/hardware";
import mainSource from "../fixtures/main.py?raw";
import robotSource from "../fixtures/robot.py?raw";
import runSource from "../fixtures/run.py?raw";
import exampleattachSource from "../fixtures/exampleattach.py?raw";
import { createWorkspace } from "./blockly";
import { resolveProject } from "./resolve";
import { createSidebar } from "./sidebar";
import { renderFile } from "./walk";

function startWorkspace(): void {
  const sidebarContainer = document.querySelector<HTMLElement>("#sidebar");
  const container = document.querySelector<HTMLElement>("#blockly");
  if (!sidebarContainer || !container) {
    throw new Error("The sidebar and Blockly containers must exist.");
  }
  const workspace = createWorkspace(container);
  const sources: Record<string, string> = {
    "main.py": mainSource,
    "robot.py": robotSource,
    "run.py": runSource,
    "exampleattach.py": exampleattachSource,
  };
  const resolved = resolveProject(sources);
  const files = ["main.py", "robot.py", "run.py", "exampleattach.py"];
  const { setActive } = createSidebar(sidebarContainer, files, (name) => {
    const source = sources[name];
    const fileResolution = resolved[name];
    if (!source || !fileResolution) {
      throw new Error(`Unknown project file: ${name}`);
    }
    workspace.clear();
    renderFile(source, workspace, fileResolution);
    setActive(name);
  });

  const resizeObserver = new ResizeObserver(() => {
    Blockly.svgResize(workspace);
  });
  resizeObserver.observe(sidebarContainer);

  workspace.clear();
  renderFile(sources["main.py"], workspace, resolved["main.py"]);
  setActive("main.py");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWorkspace, { once: true });
} else {
  startWorkspace();
}
