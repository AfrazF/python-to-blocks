import * as Blockly from "blockly";

/**
 * Standalone colour value block, for expressions like `Color.RED` or
 * `if sensor.color() == Color.RED`.
 *
 * The block's own path is already the cyan pill, so the field is told not to
 * draw a second, darker pill inside it (`noWrapper`). Per
 * `docs/pybricks-blocks/hub/pybricks_variables_get_color.svg`, the block
 * contains only the swatch, the label and the arrow.
 */
Blockly.Blocks["pybricks_colour"] = {
  init() {
    this.jsonInit({
      type: "pybricks_colour",
      message0: "%1",
      args0: [{ type: "field_colour_pill", name: "COLOR", noWrapper: true }],
      output: "Colour",
      colour: "#5cb1d6",
    });
  },
};
