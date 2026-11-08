import * as Blockly from "blockly";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";
import { FieldDarkSquare } from "../fields/FieldDarkSquare";

/**
 * ColorSensor blocks (Step v2b.2b.d.3). SPIKE Prime only — EV3/NXT deferred.
 *
 * Reference SVGs: `docs/pybricks-blocks/color_sensor/`. Every block is one row:
 *
 *   color sensor | (line_left ▾) <tail>
 *
 * The reference SVGs draw a 25×25 icon and a 3×30 divider before the first
 * field. We render the plain text "color sensor" instead — the icon is a
 * base64 image field that adds no information the label does not already carry,
 * and the text keeps the block readable at any zoom.
 *
 * Colour is the Input cyan `#5cb1d6` / `#4585a1`, matching `pybricks_colour`
 * and the Input toolbox category.
 */

export const COLOR_SENSOR_COLOUR = "#5cb1d6";
export const COLOR_SENSOR_COLOUR_SECONDARY = "#4585a1";

/** All six SPIKE Prime ports. */
const portOptions: [string, string][] = [
  ["A", "A"],
  ["B", "B"],
  ["C", "C"],
  ["D", "D"],
  ["E", "E"],
  ["F", "F"],
];

/**
 * Placeholder for the SENSOR pill when the file resolves no color sensors —
 * same pattern as `hubOptions` in `hub.ts`. A block dragged from the toolbox
 * has no source range, so it cannot look up its own sensors; the BLOCK_CREATE
 * listener in `main.ts` fills the real list in.
 */
const sensorPlaceholder: [string, string][] = [["sensor", "sensor"]];

/** `color` / `hsv` — the two shapes of the one `pybricks_color_sensor_color`. */
const colorMethods: [string, string][] = [
  ["color", "color"],
  ["hsv", "hsv"],
];

/**
 * Shared extra-state plumbing for the three reporter blocks.
 *
 * The SENSOR field is a pill dropdown whose options are the color sensors
 * resolved for the current file. Parsed blocks get them from the walker's
 * `extraState`; a block dragged from the toolbox gets them from the
 * BLOCK_CREATE listener in `main.ts`.
 */
function sensorExtraState(block: Blockly.Block): {
  saveExtraState: () => { sensors: string[] };
  loadExtraState: (state: { sensors?: string[] }) => void;
} {
  return {
    saveExtraState() {
      const self = block as Blockly.Block & { sensors?: string[] };
      return { sensors: self.sensors || [] };
    },
    loadExtraState(state: { sensors?: string[] }) {
      const self = block as Blockly.Block & { sensors?: string[] };
      self.sensors = state.sensors || [];
      const options: [string, string][] =
        self.sensors.length > 0
          ? self.sensors.map((sensor) => [sensor, sensor])
          : sensorPlaceholder;
      (self.getField("SENSOR") as any)?.setOptions(options);
    },
  };
}

/** The "color sensor |" label that opens every block in this family. */
function appendLabelRow(input: Blockly.Input): void {
  input.appendField("color sensor |");
}

Blockly.Blocks["pybricks_color_sensor_setup"] = {
  init() {
    const row = this.appendDummyInput("SENSOR_ROW");
    appendLabelRow(row);
    row
      .appendField(new FieldDarkSquare(), "NAME")
      .appendField("on")
      .appendField(new FieldPillDropdown(portOptions), "PORT");

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(COLOR_SENSOR_COLOUR);
    this.setColourSecondary?.(COLOR_SENSOR_COLOUR_SECONDARY);
  },
};

Blockly.Blocks["pybricks_color_sensor_color"] = {
  init() {
    const row = this.appendDummyInput("SENSOR_ROW");
    appendLabelRow(row);
    row
      .appendField(new FieldPillDropdown(sensorPlaceholder), "SENSOR")
      // Transparent square dropdown, per the reference SVG.
      .appendField(new Blockly.FieldDropdown(colorMethods), "METHOD");

    this.setOutput(true, "Color");
    this.setColour(COLOR_SENSOR_COLOUR);
    this.setColourSecondary?.(COLOR_SENSOR_COLOUR_SECONDARY);
    Object.assign(this, sensorExtraState(this));
  },
};

Blockly.Blocks["pybricks_color_sensor_reflection"] = {
  init() {
    const row = this.appendDummyInput("SENSOR_ROW");
    appendLabelRow(row);
    row
      .appendField(new FieldPillDropdown(sensorPlaceholder), "SENSOR")
      .appendField("reflected light");

    this.setOutput(true, "Number");
    this.setColour(COLOR_SENSOR_COLOUR);
    this.setColourSecondary?.(COLOR_SENSOR_COLOUR_SECONDARY);
    Object.assign(this, sensorExtraState(this));
  },
};

Blockly.Blocks["pybricks_color_sensor_ambient"] = {
  init() {
    const row = this.appendDummyInput("SENSOR_ROW");
    appendLabelRow(row);
    row
      .appendField(new FieldPillDropdown(sensorPlaceholder), "SENSOR")
      .appendField("ambient light");

    this.setOutput(true, "Number");
    this.setColour(COLOR_SENSOR_COLOUR);
    this.setColourSecondary?.(COLOR_SENSOR_COLOUR_SECONDARY);
    Object.assign(this, sensorExtraState(this));
  },
};
