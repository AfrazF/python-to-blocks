import * as Blockly from "blockly";
import { FieldDarkSquare } from "../fields/FieldDarkSquare";
import { FieldPillDropdown } from "../fields/FieldPillDropdown";

/**
 * Variable blocks (Step v2b.2b.e).
 *
 * Reference SVGs: `docs/pybricks-blocks/variables/`.
 *
 *   {variable icon} | [X] starting at ___
 *   {variable icon} | (X ▾) set to ___
 *
 * The leading icon and divider are text placeholders (`variable |`) until
 * v2d.1 ships real block icons — same pattern as the wait block.
 *
 * The NAME field is asymmetric on purpose: `var_declare` CREATES a name, so it
 * is a free-text dark square; `var_set` SELECTS an existing variable, so it is
 * a pill dropdown listing every variable resolved for the file.
 *
 * VALUE is an `input_value` slot whose default shadow is `pybricks_number`
 * (a white pill). Any reporter can be dropped onto it.
 */

/**
 * Placeholder for the NAME pill when the file resolves no variables — same
 * pattern as `motorPlaceholder` in `motor.ts`. A block dragged from the
 * toolbox has no source range, so it cannot look up its own variables; the
 * BLOCK_CREATE listener in `main.ts` fills the real list in.
 */
const variablePlaceholder: [string, string][] = [["variable", "variable"]];

/**
 * Shared extra-state plumbing for `pybricks_var_set`.
 *
 * The NAME field is a pill dropdown whose options are the variables resolved
 * for the current file. Parsed blocks get them from the walker's `extraState`;
 * a block dragged from the toolbox gets them from the BLOCK_CREATE listener in
 * `main.ts`.
 */
function variableExtraState(block: Blockly.Block): {
  saveExtraState: () => { variables: string[] };
  loadExtraState: (state: { variables?: string[] }) => void;
} {
  return {
    saveExtraState() {
      const self = block as Blockly.Block & { variables?: string[] };
      return { variables: self.variables || [] };
    },
    loadExtraState(state: { variables?: string[] }) {
      const self = block as Blockly.Block & { variables?: string[] };
      self.variables = state.variables || [];
      const options: [string, string][] =
        self.variables.length > 0
          ? self.variables.map((name) => [name, name])
          : variablePlaceholder;
      (self.getField("NAME") as any)?.setOptions(options);
    },
  };
}

/**
 * The VALUE slot's default shadow. `appendValueInput` creates the connection
 * during `init()`, so `setShadowState` is safe to call here — before the block
 * has an SVG.
 */
function setValueShadow(block: Blockly.Block): void {
  block.getInput("VALUE")?.connection?.setShadowState({
    type: "pybricks_number",
    fields: { NUM: 0 },
  });
}

Blockly.Blocks["pybricks_var_reporter"] = {
  init() {
    this.jsonInit({
      type: "pybricks_var_reporter",
      message0: "%1",
      args0: [{ type: "field_input", name: "NAME", text: "" }],
      output: null,
      colour: "#ff6680",
    });
  },
};

Blockly.Blocks["pybricks_var_declare"] = {
  init() {
    this.appendDummyInput("VAR_ROW")
      .appendField("variable |")
      .appendField(new FieldDarkSquare(), "NAME")
      .appendField("starting at");
    this.appendValueInput("VALUE");

    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#ff6680");

    setValueShadow(this);
  },
};

Blockly.Blocks["pybricks_var_set"] = {
  init() {
    this.appendDummyInput("VAR_ROW")
      .appendField("variable |")
      .appendField(new FieldPillDropdown(variablePlaceholder), "NAME")
      .appendField("set to");
    this.appendValueInput("VALUE");

    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#ff6680");

    Object.assign(this, variableExtraState(this));

    setValueShadow(this);
  },
};
