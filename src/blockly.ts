import * as Blockly from "blockly";
import { pybricksTheme } from "./theme";

export function createWorkspace(container: HTMLElement): Blockly.WorkspaceSvg {
  return Blockly.inject(container, {
    renderer: "zelos",
    theme: pybricksTheme,
    readOnly: true,
    trashcan: false,
    grid: {
      spacing: 20,
      length: 3,
      colour: "#ccc",
      snap: false,
    },
    zoom: {
      // Built-in zoom buttons are replaced by the custom Material Symbol
      // controls mounted in main.ts (top-right of the canvas).
      controls: false,
      wheel: true,
      startScale: 0.9,
    },
    move: {
      scrollbars: true,
      drag: true,
      wheel: true,
    },
  });
}
