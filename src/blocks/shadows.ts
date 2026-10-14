import * as Blockly from "blockly";

export function setNumberShadows(
  block: Blockly.Block,
  inputNames: string[],
): void {
  for (const inputName of inputNames) {
    block.getInput(inputName)?.connection?.setShadowState({
      type: "math_number",
      fields: { NUM: 0 },
    });
  }
}
