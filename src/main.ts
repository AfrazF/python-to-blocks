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
import "./blocks/for";
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

  const revealBlockSource = (block: Blockly.Block): void => {
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
  };

  // Blockly readOnly mode suppresses gesture-driven SELECTED events, so mouse
  // clicks are read straight off the SVG. Blockly 13 puts `data-id` on each
  // block's <g> (class `blocklyBlock`, not `blocklyDraggable`).
  const canvas = workspace.getCanvas();
  canvas.addEventListener("click", (event: MouseEvent) => {
    let el = event.target as Element | null;

    // A comment icon sits inside the block's <g data-id>, so it would otherwise
    // fall through to the block-body branch and reveal the whole block. Handle
    // it first: paint the comment's own range and stop. highlightComment() is a
    // model decoration, so it does not focus Monaco and the bubble stays open.
    // If the block carries no comment range, fall through to the block reveal
    // so that icon keeps its old behaviour.
    const icon = el?.closest?.(".blocklyCommentIcon");
    if (icon) {
      const owner = icon.closest("[data-id]");
      const ownerId = owner?.getAttribute("data-id");
      const ownerBlock = ownerId ? workspace.getBlockById(ownerId) : null;
      const { commentSourceStart, commentSourceEnd } = (ownerBlock ?? {}) as {
        commentSourceStart?: number;
        commentSourceEnd?: number;
      };
      if (
        typeof commentSourceStart === "number" &&
        typeof commentSourceEnd === "number"
      ) {
        editor.highlightComment(commentSourceStart, commentSourceEnd);
        return;
      }
    }

    while (el && el !== canvas && !el.hasAttribute("data-id")) {
      el = el.parentElement;
    }

    const blockId = el && el !== canvas ? el.getAttribute("data-id") : null;
    const block = blockId ? workspace.getBlockById(blockId) : null;
    if (!block) {
      // An element inside the block canvas that is not part of a block: drop
      // both highlights left over from the last block.
      editor.clearSelection();
      editor.clearCommentHighlight();
      clearBlockHighlight();
      return;
    }

    editor.clearCommentHighlight();
    revealBlockSource(block);
  });

  // The empty-area background rect lives in the `.blocklyWorkspace` group,
  // which is a sibling of `.blocklyBlockCanvas` — clicks there never bubble
  // through the canvas listener above. Without this, clicking empty space
  // left the previous block glowing. Comment bubbles and comment icons render
  // inside block groups, so they do not reach this listener.
  const backgroundRect = workspace
    .getParentSvg()
    .querySelector<SVGElement>(".blocklyMainBackground");
  backgroundRect?.addEventListener("click", () => {
    editor.clearSelection();
    editor.clearCommentHighlight();
    clearBlockHighlight();
  });

  // Kept for keyboard navigation, which still emits SELECTED in readOnly mode.
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
    if (block) {
      revealBlockSource(block);
    }
  });

  // Reverse sync: moving the cursor in Monaco briefly glows the innermost
  // block whose source range contains the cursor. highlightBlock() is a
  // temporary visual effect and does not fire SELECTED, so this cannot loop
  // back into the block -> Monaco handler above.
  let lastHighlightedBlockId: string | null = null;
  let highlightTimer: ReturnType<typeof setTimeout> | null = null;

  // highlightBlock(null) clears every stored highlight synchronously (it calls
  // setHighlighted(false), which only toggles the `blocklyHighlighted` class),
  // so clearing then re-adding in a loop is safe and leaves no stray glow.
  const clearBlockHighlight = (): void => {
    if (lastHighlightedBlockId) {
      workspace.highlightBlock(lastHighlightedBlockId, false);
    }
    workspace.highlightBlock(null);
    lastHighlightedBlockId = null;
  };

  // Highlight a block and everything nested inside it: statement inputs,
  // value inputs, and the statement chain that follows within those inputs.
  // `getChildren()` also returns the block's own next statement, which is a
  // sibling rather than a descendant, so it is skipped at the root but kept
  // once we are inside a statement input. Shadow blocks (inline literals)
  // render inside their parent's outline, so they are skipped too.
  const highlightSubtree = (
    block: Blockly.Block,
    includeNext: boolean,
  ): void => {
    if (block.isShadow()) {
      return;
    }
    workspace.highlightBlock(block.id, true);
    const next = block.getNextBlock();
    for (const child of block.getChildren(false)) {
      if (!includeNext && child === next) {
        continue;
      }
      highlightSubtree(child, true);
    }
  };

  editor.onCursorChange((offset) => {
    // Cursor events fire on every click and scroll; settle before acting.
    if (highlightTimer) {
      clearTimeout(highlightTimer);
    }
    highlightTimer = setTimeout(() => {
      highlightTimer = null;
      type Ranged = Blockly.Block & {
        sourceStart?: number;
        sourceEnd?: number;
        statementStart?: number;
        statementEnd?: number;
      };
      const allBlocks = workspace
        .getAllBlocks(false)
        .filter((block) => block.type !== "pybricks_setup") as Ranged[];

      // 1. Narrow ranges first: the innermost block containing the cursor.
      const narrow = allBlocks.filter(
        (block) =>
          typeof block.sourceStart === "number" &&
          typeof block.sourceEnd === "number" &&
          offset >= block.sourceStart &&
          offset <= block.sourceEnd,
      );

      let best: Ranged | null = null;

      if (narrow.length > 0) {
        // Innermost = smallest range; ties broken by earliest start.
        best = narrow.sort((a, b) => {
          const aSize = a.sourceEnd! - a.sourceStart!;
          const bSize = b.sourceEnd! - b.sourceStart!;
          if (aSize !== bSize) {
            return aSize - bSize;
          }
          return a.sourceStart! - b.sourceStart!;
        })[0];
      } else {
        // 2. Fall back to whole-statement ranges (imports), so clicking the
        // `from`/`import` keywords or a comma still finds a block.
        const atStatement = allBlocks.filter(
          (block) =>
            typeof block.statementStart === "number" &&
            typeof block.statementEnd === "number" &&
            offset >= block.statementStart &&
            offset <= block.statementEnd,
        );
        if (atStatement.length > 0) {
          best = atStatement.sort((a, b) => a.sourceStart! - b.sourceStart!)[0];
        }
      }

      if (best) {
        if (best.id !== lastHighlightedBlockId) {
          // Clear first so a click on a nested block replaces the parent's
          // glow at any depth instead of stacking on top of it.
          clearBlockHighlight();
          lastHighlightedBlockId = best.id;
          highlightSubtree(best, false);
        }
      } else {
        clearBlockHighlight();
      }
    }, 50);
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
