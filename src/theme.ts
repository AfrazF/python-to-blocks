import * as Blockly from "blockly";

export const pybricksTheme = Blockly.Theme.defineTheme("pybricks", {
  name: "pybricks",
  base: Blockly.Themes.Classic,
  blockStyles: {
    setup: { colourPrimary: "#9a72a2", colourSecondary: "#74567a" },
    output: { colourPrimary: "#4c97ff", colourSecondary: "#3971bf" },
    input: { colourPrimary: "#5cb1d6", colourSecondary: "#4585a1" },
    flow: { colourPrimary: "#ffab19", colourSecondary: "#bf8013" },
    variables: { colourPrimary: "#ff6680", colourSecondary: "#bf4d60" },
    "hardware-objects": {
      colourPrimary: "#46BAEC",
      colourSecondary: "#358BB0",
    },
    data: { colourPrimary: "#00cc99", colourSecondary: "#009973" },
    other: { colourPrimary: "#9a72a2", colourSecondary: "#74567a" },
  },
  componentStyles: {
    workspaceBackgroundColour: "#f2f2f2",
    // v2b.2 continuous toolbox: matches the Atom One Light chrome.
    toolboxBackgroundColour: "#f0f0f0",
    toolboxForegroundColour: "#696c77",
    flyoutBackgroundColour: "#fafafa",
    flyoutForegroundColour: "#383a42",
    flyoutOpacity: 1,
  },
  fontStyle: {
    family: '"Helvetica Neue", "Segoe UI", Helvetica, sans-serif',
    weight: "bold",
    size: 12,
  },
});

export const pybricksDark = Blockly.Theme.defineTheme("pybricks-dark", {
  name: "pybricks-dark",
  base: Blockly.Themes.Classic,
  blockStyles: {
    setup: { colourPrimary: "#9a72a2", colourSecondary: "#74567a" },
    output: { colourPrimary: "#4c97ff", colourSecondary: "#3971bf" },
    input: { colourPrimary: "#5cb1d6", colourSecondary: "#4585a1" },
    flow: { colourPrimary: "#ffab19", colourSecondary: "#bf8013" },
    variables: { colourPrimary: "#ff6680", colourSecondary: "#bf4d60" },
    "hardware-objects": {
      colourPrimary: "#46BAEC",
      colourSecondary: "#358BB0",
    },
    data: { colourPrimary: "#00cc99", colourSecondary: "#009973" },
    other: { colourPrimary: "#9a72a2", colourSecondary: "#74567a" },
  },
  componentStyles: {
    workspaceBackgroundColour: "#2c313a",
    scrollbarColour: "#4e4e4e",
    scrollbarOpacity: 0.4,
    // v2b.2 continuous toolbox: matches the Atom One Dark chrome.
    toolboxBackgroundColour: "#21252b",
    toolboxForegroundColour: "#9da5b4",
    flyoutBackgroundColour: "#282c34",
    flyoutForegroundColour: "#d7dae0",
    flyoutOpacity: 1,
  },
});
