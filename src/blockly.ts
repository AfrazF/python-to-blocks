import * as Blockly from "blockly";
import { registerContinuousToolbox } from "@blockly/continuous-toolbox";
import { pybricksTheme } from "./theme";

// v2b.2 step 1: nested category toolbox for the continuous toolbox plugin.
// Only injected when ?editable=1 is present; the default read-only viewer
// keeps no toolbox at all.
const toolboxXml = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Setup",
      colour: "45",
      contents: [
        { kind: "block", type: "pybricks_hub" },
        { kind: "block", type: "pybricks_motor_setup" },
        { kind: "block", type: "pybricks_drivebase_setup" },
      ],
    },
    {
      kind: "category",
      name: "Output",
      colour: "217",
      contents: [
        {
          kind: "category",
          name: "Drivebase",
          colour: "217",
          contents: [
            { kind: "block", type: "pybricks_drive_move" },
            { kind: "block", type: "pybricks_drive_reset" },
            { kind: "block", type: "pybricks_drive_use_gyro" },
            { kind: "block", type: "pybricks_drive_configure" },
          ],
        },
        {
          kind: "category",
          name: "Motors",
          colour: "217",
          contents: [
            { kind: "block", type: "pybricks_motor_run_target" },
            { kind: "block", type: "pybricks_motor_run_angle" },
            { kind: "block", type: "pybricks_motor_run_until_stalled" },
            { kind: "block", type: "pybricks_motor_reset_angle" },
            { kind: "block", type: "pybricks_motor_stop" },
          ],
        },
        { kind: "category", name: "Terminal", colour: "217", contents: [] },
      ],
    },
    {
      kind: "category",
      name: "Input",
      colour: "197",
      contents: [
        { kind: "category", name: "Color", colour: "197", contents: [] },
        { kind: "category", name: "Distance", colour: "197", contents: [] },
        { kind: "category", name: "Force", colour: "197", contents: [] },
        { kind: "category", name: "IMU", colour: "197", contents: [] },
      ],
    },
    {
      kind: "category",
      name: "Light & Sound",
      colour: "260",
      contents: [
        {
          kind: "category",
          name: "Matrix",
          colour: "260",
          contents: [
            { kind: "block", type: "pybricks_hub_display_icon" },
            { kind: "block", type: "pybricks_hub_display_char" },
            { kind: "block", type: "pybricks_hub_display_number" },
            { kind: "block", type: "pybricks_hub_display_off" },
          ],
        },
        {
          kind: "category",
          name: "Button Light",
          colour: "260",
          contents: [],
        },
        { kind: "category", name: "Sound", colour: "260", contents: [] },
      ],
    },
    {
      kind: "category",
      name: "Control",
      colour: "38",
      contents: [
        { kind: "block", type: "pybricks_if" },
        { kind: "block", type: "pybricks_while" },
        { kind: "block", type: "pybricks_wait" },
      ],
    },
    {
      kind: "category",
      name: "Operators & Data",
      colour: "160",
      contents: [
        {
          kind: "category",
          name: "Math",
          colour: "160",
          contents: [
            { kind: "block", type: "math_number" },
            { kind: "block", type: "math_arithmetic" },
          ],
        },
        {
          kind: "category",
          name: "Compare",
          colour: "160",
          contents: [{ kind: "block", type: "logic_compare" }],
        },
        {
          kind: "category",
          name: "Logic",
          colour: "160",
          contents: [
            { kind: "block", type: "logic_boolean" },
            { kind: "block", type: "logic_operation" },
          ],
        },
        { kind: "category", name: "Text", colour: "160", contents: [] },
        { kind: "category", name: "Lists", colour: "160", contents: [] },
      ],
    },
    {
      kind: "category",
      name: "Variables",
      colour: "348",
      contents: [{ kind: "block", type: "pybricks_var_set" }],
    },
    {
      kind: "category",
      name: "Functions",
      colour: "348",
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
          flyoutsVerticalToolbox: "ContinuousFlyout",
          metricsManager: "ContinuousMetrics",
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
