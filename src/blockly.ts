import * as Blockly from "blockly";
import {
  registerContinuousToolbox,
  ContinuousMetrics,
  ContinuousFlyout,
} from "@blockly/continuous-toolbox";
import { pybricksTheme } from "./theme";

// v2b.2 step 2: force the Scratch / SPIKE Prime rail and flyout widths.
class CustomMetrics extends ContinuousMetrics {
  override getToolboxMetrics() {
    return { ...super.getToolboxMetrics(), width: 62 };
  }
  override getFlyoutMetrics(getWorkspaceCoordinates = false) {
    return { ...super.getFlyoutMetrics(getWorkspaceCoordinates), width: 250 };
  }
}

class CustomFlyout extends ContinuousFlyout {
  override getWidth(): number {
    return 250;
  }
}

// v2b.2 step 1: nested category toolbox for the continuous toolbox plugin.
// Only injected when ?editable=1 is present; the default read-only viewer
// keeps no toolbox at all.
const toolboxXml = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Setup",
      colour: "#ffbf00",
      contents: [
        { kind: "block", type: "pybricks_hub" },
        { kind: "block", type: "pybricks_motor_setup" },
        { kind: "block", type: "pybricks_drivebase_setup" },
      ],
    },
    {
      kind: "category",
      name: "Output",
      colour: "#4c97ff",
      contents: [
        { kind: "label", text: "Drivebase" },
        { kind: "block", type: "pybricks_drive_move" },
        { kind: "block", type: "pybricks_drive_reset" },
        { kind: "block", type: "pybricks_drive_use_gyro" },
        { kind: "block", type: "pybricks_drive_configure" },

        { kind: "label", text: "Motors" },
        { kind: "block", type: "pybricks_motor_run_target" },
        { kind: "block", type: "pybricks_motor_run_angle" },
        { kind: "block", type: "pybricks_motor_run_until_stalled" },
        { kind: "block", type: "pybricks_motor_reset_angle" },
        { kind: "block", type: "pybricks_motor_stop" },

        { kind: "label", text: "Terminal" },
      ],
    },
    {
      kind: "category",
      name: "Input",
      colour: "#5cb1d6",
      contents: [
        { kind: "label", text: "Color" },
        { kind: "label", text: "Distance" },
        { kind: "label", text: "Force" },
        { kind: "label", text: "IMU" },
      ],
    },
    {
      kind: "category",
      name: "Light & Sound",
      colour: "#9b6af6",
      contents: [
        { kind: "label", text: "Matrix" },
        { kind: "block", type: "pybricks_hub_display_icon" },
        { kind: "block", type: "pybricks_hub_display_char" },
        { kind: "block", type: "pybricks_hub_display_number" },
        { kind: "block", type: "pybricks_hub_display_off" },

        { kind: "label", text: "Button Light" },
        { kind: "label", text: "Sound" },
      ],
    },
    {
      kind: "category",
      name: "Control",
      colour: "#ffab19",
      contents: [
        { kind: "block", type: "pybricks_if" },
        { kind: "block", type: "pybricks_while" },
        { kind: "block", type: "pybricks_wait" },
      ],
    },
    {
      kind: "category",
      name: "Operators",
      colour: "#21a176",
      contents: [
        { kind: "label", text: "Math" },
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },

        { kind: "label", text: "Compare" },
        { kind: "block", type: "logic_compare" },

        { kind: "label", text: "Logic" },
        { kind: "block", type: "logic_boolean" },
        { kind: "block", type: "logic_operation" },

        { kind: "label", text: "Text" },
        { kind: "label", text: "Lists" },
      ],
    },
    {
      kind: "category",
      name: "Variables",
      colour: "#ff6680",
      contents: [{ kind: "block", type: "pybricks_var_set" }],
    },
    {
      kind: "category",
      name: "Functions",
      colour: "#ff6680",
      contents: [
        { kind: "block", type: "pybricks_task" },
        { kind: "block", type: "pybricks_call" },
      ],
    },
  ],
};

export function createWorkspace(
  container: HTMLElement,
  isEditable = false,
): Blockly.WorkspaceSvg {
  if (isEditable) {
    registerContinuousToolbox();
  }

  const workspace = Blockly.inject(container, {
    renderer: "zelos",
    theme: pybricksTheme,
    // Read-only stays the default everywhere; only ?editable=1 unlocks
    // gesture editing (v2b behind a feature flag).
    readOnly: !isEditable,
    trashcan: isEditable,
    toolbox: isEditable ? (toolboxXml as any) : undefined,
    plugins: isEditable
      ? {
          toolbox: "ContinuousToolbox",
          flyoutsVerticalToolbox: CustomFlyout,
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

  const flyout = workspace.getFlyout();
  if (flyout) {
    // @ts-ignore -- autoClose lives on ContinuousFlyout, not the base Flyout.
    flyout.autoClose = true;
  }

  return workspace;
}
