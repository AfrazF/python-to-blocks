import * as Blockly from "blockly";

/**
 * The Pybricks colour palette: enum name → hex.
 *
 * Values match the swatches on
 * https://docs.pybricks.com/en/stable/parameters/color.html — each is the RGB
 * form of the documented HSV triple. `VIOLET` is `Color(h=270, s=100, v=100)`,
 * whose red channel is 127.5 and rounds to 128 (`#80`), not 127 (`#7f`).
 *
 * Shared by `FieldColourPill` (labels + swatches) and the hub light walker
 * (which validates `Color.<NAME>` arguments against these keys).
 */
export const COLOUR_MAP: Record<string, string> = {
  RED: "#ff0000",
  ORANGE: "#ff8000",
  YELLOW: "#ffff00",
  GREEN: "#00ff00",
  CYAN: "#00ffff",
  BLUE: "#0000ff",
  VIOLET: "#8000ff",
  MAGENTA: "#ff00ff",
  WHITE: "#ffffff",
  GRAY: "#808080",
  BLACK: "#1a1a1a",
  NONE: "#000000",
};

export function scaleColour(colour: string, factor: number): string {
  let hex = colour.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = [...hex].map((channel) => channel + channel).join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    hex = "4c97ff";
  }

  const channels = [0, 2, 4].map((offset) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * factor),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function getFieldColours(sourceBlock: Blockly.Block | null) {
  const blockColour = sourceBlock?.getColour() || "#4c97ff";
  return {
    fill: scaleColour(blockColour, 0.85),
    stroke: scaleColour(blockColour, 0.75),
  };
}
