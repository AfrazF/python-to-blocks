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
import { createEditor } from "./editor";
import { pybricksDark, pybricksTheme } from "./theme";

let currentFiles: Record<string, string> = {
  "main.py": mainSource,
  "robot.py": robotSource,
  "run.py": runSource,
  "exampleattach.py": exampleattachSource,
};

let hasUploaded = false;

function startWorkspace(): void {
  const sidebarContainer = document.querySelector<HTMLElement>("#sidebar");
  const container = document.querySelector<HTMLElement>("#blockly");
  const splitter = document.querySelector<HTMLElement>("#editor-splitter");
  const editorContainer = document.querySelector<HTMLElement>("#editor");
  if (!sidebarContainer || !container || !splitter || !editorContainer) {
    throw new Error(
      "The sidebar, Blockly, splitter, and editor containers must exist.",
    );
  }
  const workspace = createWorkspace(container);
  const editor = createEditor(editorContainer);
  let editorVisible = false;
  (window as any).__pybricks = { workspace, editor };
  let resolved = resolveProject(currentFiles);
  const files = Object.keys(currentFiles);
  const errorBanner = document.getElementById(
    "sidebar-error",
  ) as HTMLDivElement | null;

  const { setActive, setFiles } = createSidebar(sidebarContainer, files, {
    onSelect: (name) => {
      const source = currentFiles[name];
      const fileResolution = resolved[name];
      if (!source || !fileResolution) {
        throw new Error(`Unknown project file: ${name}`);
      }
      workspace.clear();
      renderFile(source, workspace, fileResolution);
      editor.setValue(source);
      setActive(name);
    },
    onUpload: async (uploadedFiles) => {
      if (errorBanner) {
        errorBanner.hidden = true;
        errorBanner.textContent = "";
      }
      try {
        const newFiles: Record<string, string> = hasUploaded
          ? { ...currentFiles }
          : {};
        for (const [name, content] of Object.entries(uploadedFiles)) {
          newFiles[name] = content;
        }
        const newResolved = resolveProject(newFiles);
        currentFiles = newFiles;
        resolved = newResolved;
        hasUploaded = true;
        setFiles(Object.keys(currentFiles));
        const activeEl = document.querySelector(
          ".sidebar-item.active",
        ) as HTMLButtonElement | null;
        const currentActive = activeEl?.textContent;
        const targetFile =
          currentActive && currentActive in currentFiles
            ? currentActive
            : Object.keys(currentFiles)[0];
        if (targetFile) {
          workspace.clear();
          renderFile(currentFiles[targetFile], workspace, resolved[targetFile]);
          editor.setValue(currentFiles[targetFile]);
          setActive(targetFile);
        }
      } catch (error) {
        if (error instanceof Error && errorBanner) {
          errorBanner.hidden = false;
          errorBanner.textContent = error.message;
        }
      }
    },
  });

  const toggleEditorButton = document.getElementById(
    "toggle-editor-btn",
  ) as HTMLButtonElement | null;
  if (!toggleEditorButton) {
    throw new Error("The editor toggle button must exist.");
  }

  toggleEditorButton.addEventListener("click", () => {
    editorVisible = !editorVisible;
    editorContainer.classList.toggle("visible", editorVisible);
    splitter.classList.toggle("visible", editorVisible);
    document.body.classList.toggle("code-visible", editorVisible);
    toggleEditorButton.title = editorVisible ? "Hide code" : "Show code";
    toggleEditorButton.setAttribute("aria-label", toggleEditorButton.title);
    toggleEditorButton.setAttribute("aria-pressed", String(editorVisible));
    Blockly.svgResize(workspace);
    editor.layout();
  });

  workspace.addChangeListener((event: Blockly.Events.Abstract) => {
    if (event.type !== Blockly.Events.SELECTED) {
      return;
    }
    const selectedEvent = event as Blockly.Events.Selected;
    // newElementId is undefined when the canvas is clicked (deselect).
    if (!selectedEvent.newElementId) {
      return;
    }

    const block = workspace.getBlockById(selectedEvent.newElementId);
    if (!block) {
      return;
    }

    // The setup hat spans the whole file, so highlighting it is noise.
    if (block.type === "pybricks_setup") {
      return;
    }

    const { sourceStart, sourceEnd } = block as Blockly.Block & {
      sourceStart?: number;
      sourceEnd?: number;
    };
    if (typeof sourceStart === "number" && typeof sourceEnd === "number") {
      editor.revealRange(sourceStart, sourceEnd);
    }
  });

  const themeToggleButton = document.getElementById(
    "theme-toggle-btn",
  ) as HTMLButtonElement | null;
  if (!themeToggleButton) {
    throw new Error("The theme toggle button must exist.");
  }

  const applyTheme = (theme: "light" | "dark") => {
    document.body.classList.toggle("dark", theme === "dark");
    workspace.setTheme(theme === "dark" ? pybricksDark : pybricksTheme);
    workspace.render();
    editor.setTheme(theme);
    themeToggleButton.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
    localStorage.setItem("theme", theme);
  };

  themeToggleButton.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });

  applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");

  const onSplitterMouseMove = (event: MouseEvent) => {
    const width = Math.max(
      240,
      Math.min(window.innerWidth * 0.6, window.innerWidth - event.clientX),
    );
    editorContainer.style.width = `${width}px`;
    editor.layout();
    Blockly.svgResize(workspace);
  };

  const onSplitterMouseUp = () => {
    document.removeEventListener("mousemove", onSplitterMouseMove);
    document.removeEventListener("mouseup", onSplitterMouseUp);
    document.body.classList.remove("resizing");
  };

  splitter.addEventListener("mousedown", (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    document.body.classList.add("resizing");
    document.addEventListener("mousemove", onSplitterMouseMove);
    document.addEventListener("mouseup", onSplitterMouseUp);
  });

  const resizeObserver = new ResizeObserver(() => {
    Blockly.svgResize(workspace);
    editor.layout();
  });
  resizeObserver.observe(sidebarContainer);

  workspace.clear();
  renderFile(currentFiles["main.py"], workspace, resolved["main.py"]);
  editor.setValue(currentFiles["main.py"]);
  setActive("main.py");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWorkspace, { once: true });
} else {
  startWorkspace();
}
