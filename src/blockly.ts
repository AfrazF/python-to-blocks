import * as Blockly from "blockly";
import {
  ContinuousMetrics,
  registerContinuousToolbox,
} from "@blockly/continuous-toolbox";
import { pybricksTheme } from "./theme";

// v2b.2: the continuous flyout sizes itself to the widest block, which made it
// eat half the canvas and squeezed the category strip. Clamping the metrics is
// the only hook that works — the flyout is an SVG <g>, so a CSS `width` is
// inert. Toolbox strip 62px, flyout 250px.
class CustomMetrics extends ContinuousMetrics {
  override getToolboxMetrics() {
    return { ...super.getToolboxMetrics(), width: 62 };
  }

  override getFlyoutMetrics(getWorkspaceCoordinates = false) {
    return { ...super.getFlyoutMetrics(getWorkspaceCoordinates), width: 250 };
  }
}

// v2b.2: Scratch-style always-open toolbox. Only block types registered in
// src/blocks/ (or Blockly's own library blocks, imported in main.ts) may
// appear here — an unregistered type throws at render time.
const toolboxXml = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Output",
      colour: "#4c97ff",
      contents: [
        { kind: "block", type: "pybricks_motor_run_target" },
        { kind: "block", type: "pybricks_motor_run_angle" },
        { kind: "block", type: "pybricks_motor_stop" },
        { kind: "block", type: "pybricks_drive_move" },
        { kind: "block", type: "pybricks_drive_reset" },
      ],
    },
    {
      kind: "category",
      name: "Flow",
      colour: "#ffab19",
      contents: [
        { kind: "block", type: "pybricks_if" },
        { kind: "block", type: "pybricks_if_else" },
        { kind: "block", type: "pybricks_while" },
        { kind: "block", type: "pybricks_for" },
        { kind: "block", type: "pybricks_wait" },
      ],
    },
    {
      kind: "category",
      name: "Python functions",
      colour: "#9a72a2",
      contents: [
        { kind: "block", type: "pybricks_task" },
        { kind: "block", type: "pybricks_function" },
        { kind: "block", type: "pybricks_call" },
      ],
    },
    {
      kind: "category",
      name: "Hardware",
      colour: "#46BAEC",
      contents: [
        { kind: "block", type: "pybricks_hub" },
        { kind: "block", type: "pybricks_motor_setup" },
        { kind: "block", type: "pybricks_drivebase_setup" },
      ],
    },
    {
      kind: "category",
      name: "Logic",
      colour: "#5cb1d6",
      contents: [
        { kind: "block", type: "logic_boolean" },
        { kind: "block", type: "logic_operation" },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "#5cb1d6",
      contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
      ],
    },
  ],
};

export function createWorkspace(
  container: HTMLElement,
  isEditable = false,
): Blockly.WorkspaceSvg {
  // The continuous toolbox replaces Blockly's default toolbox/flyout/metrics
  // classes globally, so it must be registered before inject().
  if (isEditable) {
    registerContinuousToolbox();
  }
  return Blockly.inject(container, {
    renderer: "zelos",
    theme: pybricksTheme,
    // Read-only stays the default everywhere; only ?editable=1 unlocks
    // gesture editing (v2b behind a feature flag).
    readOnly: !isEditable,
    // v2b.2: the always-open flyout is the delete target now, so the trashcan
    // is gone and no longer overlaps the custom canvas controls.
    trashcan: false,
    toolbox: isEditable ? toolboxXml : undefined,
    plugins: isEditable
      ? {
          toolbox: "ContinuousToolbox",
          flyoutsVerticalToolbox: "ContinuousFlyout",
          // Registered as a class rather than the plugin's string name so the
          // width clamps in CustomMetrics are actually used.
          metricsManager: CustomMetrics,
        }
      : undefined,
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
