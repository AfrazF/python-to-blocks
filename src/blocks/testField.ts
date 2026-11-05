import * as Blockly from "blockly";
import { FieldWhiteInPill } from "../fields/FieldWhiteInPill";

Blockly.Blocks["pybricks_test_fields"] = {
  init() {
    this.jsonInit({
      type: "pybricks_test_fields",
      message0: "test  %1   %2   %3   %4   %5",
      args0: [
        {
          type: "field_pill_dropdown",
          name: "DB",
          options: [["drive base", "drive"]],
        },
        {
          type: "field_dark_square",
          name: "NAME",
          text: "drive",
        },
        {
          type: "field_dropdown",
          name: "WHAT",
          options: [
            ["drive speed", "drive speed"],
            ["drive acceleration", "drive acceleration"],
            ["turn speed", "turn speed"],
            ["turn acceleration", "turn acceleration"],
          ],
        },
        {
          type: "field_white_in_pill",
          name: "VAL",
          value: 150,
        },
        {
          type: "pybricks_colour",
          name: "COLOR_BLOCK",
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: "#4c97ff",
    });
    (this.getField("VAL") as FieldWhiteInPill).setSuffix("mm/s");
  },
};
