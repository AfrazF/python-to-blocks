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
      controls: true,
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
