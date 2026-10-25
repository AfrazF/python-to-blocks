import * as Blockly from "blockly";

/**
 * Hub display blocks (Step 35).
 *
 * SPIKE Prime purple: `#9b6af6` fill, `#691ff0` stroke — see the Colors table
 * in `docs/BLOCK_DESIGN.md`.
 *
 * Shape follows Pybricks Code: `[hub ▾] display [method ▾] <arg>`. Both the
 * hub object and the method name are dropdowns, matching Pybricks' own block.
 *
 * Four separate block types, one per method, so the walker dispatch stays a
 * simple match. Each block's `METHOD` dropdown lists every method for visual
 * parity with Pybricks; the walker sets it to the block's own method, and in
 * read-only mode the dropdown cannot be opened.
 *
 * `ICON`, `CHAR`, and `NUMBER` are `field_input` in v1.5. Step v2b.2b converts
 * `ICON` to a circular dropdown, `CHAR` to a quote-wrapped square, and `NUMBER`
 * to a circular slot. Do not attempt those shapes here.
 *
 * `hub.display.number` is not used by any fixture. It ships anyway so the block
 * set is complete for future code.
 */

const HUB_COLOUR = "#9b6af6";
const HUB_COLOUR_SECONDARY = "#691ff0";

/** Every `hub.display.*` method, in Pybricks' own order. */
const displayMethods = [
  ["icon", "icon"],
  ["char", "char"],
  ["number", "number"],
  ["off", "off"],
];

/**
 * The hub object dropdown. Purely aesthetic in v1.5 — the app is read-only and
 * a project has exactly one hub, so the list holds a single entry and nothing
 * reads the selection. v2d.6a fills this from the object table so a project
 * with several hubs can pick between them.
 */
const hubOptions = [["hub", "hub"]];

Blockly.Blocks["pybricks_hub_display_icon"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub_display_icon",
      message0: "%1 display %2 %3",
      args0: [
        { type: "field_dropdown", name: "HUB", options: hubOptions },
        { type: "field_dropdown", name: "METHOD", options: displayMethods },
        { type: "field_input", name: "ICON", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUB_COLOUR,
      colourSecondary: HUB_COLOUR_SECONDARY,
    });
  },
};

Blockly.Blocks["pybricks_hub_display_char"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub_display_char",
      message0: "%1 display %2 %3",
      args0: [
        { type: "field_dropdown", name: "HUB", options: hubOptions },
        { type: "field_dropdown", name: "METHOD", options: displayMethods },
        { type: "field_input", name: "CHAR", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUB_COLOUR,
      colourSecondary: HUB_COLOUR_SECONDARY,
    });
  },
};

Blockly.Blocks["pybricks_hub_display_number"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub_display_number",
      message0: "%1 display %2 %3",
      args0: [
        { type: "field_dropdown", name: "HUB", options: hubOptions },
        { type: "field_dropdown", name: "METHOD", options: displayMethods },
        { type: "field_input", name: "NUMBER", text: "" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUB_COLOUR,
      colourSecondary: HUB_COLOUR_SECONDARY,
    });
  },
};

Blockly.Blocks["pybricks_hub_display_off"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub_display_off",
      message0: "%1 display %2",
      args0: [
        { type: "field_dropdown", name: "HUB", options: hubOptions },
        { type: "field_dropdown", name: "METHOD", options: displayMethods },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUB_COLOUR,
      colourSecondary: HUB_COLOUR_SECONDARY,
    });
  },
};
