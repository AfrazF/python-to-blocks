import * as Blockly from "blockly";

/**
 * Value reporter blocks (Step v2b.2b.e).
 *
 * pybricks_number — shadow-only white pill. No toolbox entry.
 *   Colour #fff so fill is white. Zelos PathObject.applyColour derives
 *   shadow stroke from parent.getColourTertiary() — no renderer patch needed.
 *
 * pybricks_string — Data green (#00cc99). Toolbox: Operators → Text.
 *
 * pybricks_boolean — Logic green (#21a176). Toolbox: Operators → Logic.
 *   Replaces stock logic_boolean in the toolbox.
 */

Blockly.Blocks["pybricks_number"] = {
  init() {
    // `colour` is a hue, not an SVG fill: "#ffffff" parses as near-black and
    // wrecks the Zelos geometry. Match the parent variable block instead, then
    // override the fill to white on every repaint via applyColour.
    //
    // We use field_input instead of field_number so we can constrain the
    // minimum width to match the reference SVG (pybricks_blockVariableSetValue.svg),
    // where the white pill is just wide enough for "0". field_number enforces
    // a wider minimum via its own sizing logic.
    this.jsonInit({
      type: "pybricks_number",
      message0: "%1",
      args0: [{ type: "field_input", name: "NUM", text: "0" }],
      output: "Number",
      colour: "#ff6680",
    });

    // Constrain the text field to a narrow minimum so the pill stays compact.
    const field = this.getField("NUM") as Blockly.FieldTextInput | null;
    if (field) {
      // Override getSize to report a narrow width matching the reference SVG.
      const origGetSize = field.getSize.bind(field);
      field.getSize = () => {
        const size = origGetSize();
        size.width = Math.min(size.width, 30);
        return size;
      };
    }

    const self = this as Blockly.BlockSvg;
    const pathObject = self.pathObject;
    const originalApplyColour = pathObject.applyColour?.bind(pathObject);
    if (originalApplyColour) {
      pathObject.applyColour = (block: Blockly.BlockSvg) => {
        originalApplyColour(block);
        // Always white fill: as a shadow (default slot) or as a connected
        // child (parsed from source). The white pill is the visual identity
        // of pybricks_number regardless of shadow state.
        pathObject.svgPath.setAttribute("fill", "#ffffff");
      };
    }
  },
};

Blockly.Blocks["pybricks_string"] = {
  init() {
    this.jsonInit({
      type: "pybricks_string",
      message0: "%1",
      args0: [{ type: "field_input", name: "TEXT", text: "" }],
      output: "String",
      colour: "#00cc99",
    });
  },
};

Blockly.Blocks["pybricks_boolean"] = {
  init() {
    this.jsonInit({
      type: "pybricks_boolean",
      message0: "%1",
      args0: [
        {
          type: "field_dropdown",
          name: "BOOL",
          options: [
            ["true", "TRUE"],
            ["false", "FALSE"],
          ],
        },
      ],
      output: "Boolean",
      colour: "#21a176",
    });
  },
};