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
 * Field shapes follow `docs/FIELD_DESIGN.md` (v2b.2b.d.1):
 * `HUB` and `METHOD` are pill dropdowns, `ICON` is a transparent square
 * dropdown, `CHAR` is a dark square, and `NUMBER` is a white square inside a
 * pill.
 *
 * `hub.display.number` is not used by any fixture. It ships anyway so the block
 * set is complete for future code.
 */

const HUB_COLOUR = "#9b6af6";
const HUB_COLOUR_SECONDARY = "#691ff0";

/** Every `hub.display.*` method, in Pybricks' own order. */
const displayMethods: [string, string][] = [
  ["icon", "icon"],
  ["char", "char"],
  ["number", "number"],
  ["off", "off"],
];

/**
 * The `pybricks.parameters.Icon` constants, in Pybricks' own order.
 *
 * The walker stores the bare name (`UP`), so codegen can emit `Icon.UP`. The
 * dropdown shows the same name — Pybricks renders icon names in full caps.
 */
const iconOptions: [string, string][] = [
  ["UP", "UP"],
  ["DOWN", "DOWN"],
  ["LEFT", "LEFT"],
  ["RIGHT", "RIGHT"],
  ["ARROW_UP", "ARROW_UP"],
  ["ARROW_DOWN", "ARROW_DOWN"],
  ["ARROW_LEFT", "ARROW_LEFT"],
  ["ARROW_RIGHT", "ARROW_RIGHT"],
  ["ARROW_LEFT_UP", "ARROW_LEFT_UP"],
  ["ARROW_LEFT_DOWN", "ARROW_LEFT_DOWN"],
  ["ARROW_RIGHT_UP", "ARROW_RIGHT_UP"],
  ["ARROW_RIGHT_DOWN", "ARROW_RIGHT_DOWN"],
  ["HAPPY", "HAPPY"],
  ["SAD", "SAD"],
  ["SMILE", "SMILE"],
  ["HEART", "HEART"],
  ["EYE_LEFT", "EYE_LEFT"],
  ["EYE_RIGHT", "EYE_RIGHT"],
  ["EYE_LEFT_BROW", "EYE_LEFT_BROW"],
  ["EYE_RIGHT_BROW", "EYE_RIGHT_BROW"],
  ["EYE_LEFT_BROW_UP", "EYE_LEFT_BROW_UP"],
  ["EYE_RIGHT_BROW_UP", "EYE_RIGHT_BROW_UP"],
  ["EYE_LEFT_BLINK", "EYE_LEFT_BLINK"],
  ["EYE_RIGHT_BLINK", "EYE_RIGHT_BLINK"],
  ["CIRCLE", "CIRCLE"],
  ["SQUARE", "SQUARE"],
  ["TRIANGLE", "TRIANGLE"],
  ["TRIANGLE_LEFT", "TRIANGLE_LEFT"],
  ["TRIANGLE_RIGHT", "TRIANGLE_RIGHT"],
  ["CLOCK", "CLOCK"],
  ["PAUSE", "PAUSE"],
  ["NO", "NO"],
  ["YES", "YES"],
  ["FULL", "FULL"],
  ["EMPTY", "EMPTY"],
];

/**
 * The hub object dropdown. Purely aesthetic in v1.5 — the app is read-only and
 * a project has exactly one hub, so the list holds a single entry and nothing
 * reads the selection. v2d.6a fills this from the object table so a project
 * with several hubs can pick between them.
 */
const hubOptions: [string, string][] = [["hub", "hub"]];

Blockly.Blocks["pybricks_hub_display_icon"] = {
  init() {
    this.jsonInit({
      type: "pybricks_hub_display_icon",
      message0: "%1 display %2 %3",
      args0: [
        { type: "field_pill_dropdown", name: "HUB", options: hubOptions },
        {
          type: "field_pill_dropdown",
          name: "METHOD",
          options: displayMethods,
        },
        // Transparent square dropdown, per `docs/FIELD_DESIGN.md`.
        { type: "field_dropdown", name: "ICON", options: iconOptions },
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
        { type: "field_pill_dropdown", name: "HUB", options: hubOptions },
        {
          type: "field_pill_dropdown",
          name: "METHOD",
          options: displayMethods,
        },
        { type: "field_dark_square", name: "CHAR", text: "" },
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
        { type: "field_pill_dropdown", name: "HUB", options: hubOptions },
        {
          type: "field_pill_dropdown",
          name: "METHOD",
          options: displayMethods,
        },
        { type: "field_white_in_pill", name: "NUMBER", value: 0 },
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
        { type: "field_pill_dropdown", name: "HUB", options: hubOptions },
        {
          type: "field_pill_dropdown",
          name: "METHOD",
          options: displayMethods,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUB_COLOUR,
      colourSecondary: HUB_COLOUR_SECONDARY,
    });
  },
};
