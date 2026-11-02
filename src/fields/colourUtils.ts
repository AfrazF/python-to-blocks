import * as Blockly from "blockly";

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
