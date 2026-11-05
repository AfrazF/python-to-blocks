import * as Blockly from "blockly";

/**
 * Standalone colour value block, for expressions like `Color.RED` or
 * `if sensor.color() == Color.RED`.
 *
 * The block itself is the pill: the field draws the swatch and the label, so
 * `message0` is just `%1` and the block has no other chrome.
 */
Blockly.Blocks["pybricks_colour"] = {
  init() {
    this.jsonInit({
      type: "pybricks_colour",
      message0: "%1",
      args0: [{ type: "field_colour_pill", name: "COLOR" }],
      output: "Colour",
      colour: "#5cb1d6",
    });
  },
};
