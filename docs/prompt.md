
 Update the Vite starter to bootstrap a Blockly workspace that matches Pybricks Code's look.

 **Read these first:**
 - **`docs/BLOCK_DESIGN.md`** for the color table
 - **`docs/OVERVIEW.md`** for project context
 - Blockly docs on [renderers](https://docs.blockly.com/guides/create-custom-blocks/renderers/overview/) and [customizing themes](https://docs.blockly.com/codelabs/theme-extension-identifier/customize-category-styles/) — the Zelos renderer is built-in, and themes use `Blockly.Theme.defineTheme`

 **1. Clean up the starter.** Remove demo markup from **`index.html`** and demo styles from **`src/style.css`**. Keep the file structure.

 **2. In `index.html`**, inside `<body`, add `<div id="blockly" style="width: 100vw; height: 100vh;"</div`.

 **3. Create `src/theme.ts`** that exports a `pybricksTheme`:
 - Use `Blockly.Theme.defineTheme('pybricks', { base: Blockly.Themes.Classic, componentStyles: { workspaceBackgroundColour: '#ecf0f1', ... } })`
 - Map the colors from **`docs/BLOCK_DESIGN.md`** to `blockStyles` entries (one style per category: setup, output, input, flow, variables, hardware-objects, data, other). Each entry uses `colourPrimary` = the fill and `colourSecondary` = the stroke.
 - Set `fontStyle: { family: '"Helvetica Neue", "Segoe UI", Helvetica, sans-serif', weight: 'bold', size: 12 }`

 **4. Create `src/pybricks.css`** with Pybricks' actual overrides (this is what makes it look right, not just the theme):
 ```css
 .blocklyText { fill: #fff; }
 .blocklyNonEditableText  rect:not(.blocklyDropdownRect),
 .blocklyEditableText  rect:not(.blocklyDropdownRect) { fill: #fff; }
 .blocklyNonEditableText  text,
 .blocklyEditableText  text,
 .blocklyNonEditableText  g  text,
 .blocklyEditableText  g  text { fill: #575E75; }
 .blocklyDropdownText { fill: #fff !important; }
 .blocklyText.blocklyBubbleText { fill: #575E75; }
 .blocklyHtmlInput {
   font-family: "Helvetica Neue", "Segoe UI", Helvetica, sans-serif;
   font-weight: bold;
   color: #575E75;
 }
 ```
 Import this in `src/main.ts`.

 **5. Create `src/blockly.ts`** that exports `createWorkspace(container: HTMLElement): Blockly.WorkspaceSvg`:
 - Import `* as Blockly from 'blockly'`
 - Import the Zelos renderer for its side effect — check the current Blockly docs or `node_modules/blockly/zelos.js` for the correct path (it's likely `import 'blockly/zelos'` or `import 'blockly/blocks'` plus a separate renderer registration).
 - Import `pybricksTheme` from `./theme`
 - Call `Blockly.inject(container, { renderer: 'zelos', theme: pybricksTheme, readOnly: true, trashcan: false, grid: { spacing: 20, length: 3, colour: '#ccc', snap: false }, zoom: { controls: true, wheel: true, startScale: 0.9 }, move: { scrollbars: true, drag: true, wheel: true } })`

 **6. Update `src/main.ts`** to call `createWorkspace` on the `#blockly` div when the DOM is ready.

 Do not parse files. Do not define any blocks. Do not add a tab bar. This step is the shell only.

 Run **`npm run dev`** and confirm in the browser: light grey canvas (`#ecf0f1`), dotted grid, Zelos-style blocks (if you add a test block manually), zoom controls, and no console errors.