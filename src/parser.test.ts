import { readFileSync } from "node:fs";
import { parser } from "@lezer/python";
import { it } from "vitest";

const files = ["robot.py", "main.py", "exampleattach.py"];

it("parses the real files", () => {
  for (const fileName of files) {
    const src = readFileSync(
      new URL(`../fixtures/${fileName}`, import.meta.url),
      "utf8",
    );
    const tree = parser.parse(src);
    console.log(fileName, tree.topNode.toString());
  }
});
