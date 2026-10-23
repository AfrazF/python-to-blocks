# AGENTS.md

Rules for AI agents working in this repository. Read this file before editing anything.

## 1. What this project is, and what it is not

A read-only viewer. It parses Pybricks Python (LEGO SPIKE Prime, FLL robots) with `@lezer/python` and renders it as Blockly blocks on the Zelos renderer, resolving imports across files so that `attachment1 as attachment_a` is known to be a `Motor`. It is not an editor: there is no Python generation, no round-trip, no block editing, no Monaco workers, no icons on blocks, and no drag-to-create. Anything unmapped becomes a `pybricks_raw_code` block and is never dropped. Scope is locked in `docs/OVERVIEW.md`; block wording and colours are locked in `docs/BLOCK_DESIGN.md`.

Pipeline, in order:

1. `src/main.ts` holds the fixture sources and calls `resolveProject` (`src/resolve.ts`).
2. `resolveProject` builds a symbol table (`src/symbols.ts`) and object table (`src/objects.ts`) per file, then resolves imports across files.
3. `renderFile` (`src/walk.ts`) parses with `@lezer/python`, walks the tree into `BlockDescriptor`s, then materialises them into Blockly blocks.
4. `src/editor.ts` shows the same source read-only in Monaco; `src/main.ts` wires the two-way highlight.

File map:

| File                                | Role                                                            |
| ----------------------------------- | --------------------------------------------------------------- |
| `src/main.ts`                       | Bootstrap, file switching, upload, theme, both sync directions  |
| `src/walk.ts`                       | Parser walk, descriptors, block materialisation                 |
| `src/resolve.ts`                    | Cross-file name resolution                                      |
| `src/symbols.ts`, `src/objects.ts`  | Per-file symbol and object tables                               |
| `src/blockly.ts`                    | `Blockly.inject` options                                        |
| `src/theme.ts`                      | Light and dark Blockly themes                                   |
| `src/editor.ts`                     | Monaco wrapper (`PyEditor`)                                     |
| `src/sidebar.ts`                    | File list, upload, drag-drop, resize handle                     |
| `src/blocks/*.ts`                   | One file per block family; each registers `Blockly.Blocks[...]` |
| `src/style.css`, `src/pybricks.css` | App chrome and Blockly field/comment styling                    |
| `fixtures/*.py`                     | The four demo files, imported with `?raw`                       |

## 2. Before you touch anything

Run both on a clean checkout:

```bash
npm ci
npm run test    # 5 files, 6 tests
npm run build   # tsc + vite build, writes dist/index.html
```

Expected output: `Test Files 5 passed (5)` and `Tests 6 passed (6)`. The six tests are one each in `src/acceptance.test.ts`, `src/walk.test.ts`, `src/resolve.test.ts`, `src/parser.test.ts`, and two in `src/symbols.test.ts`.

If either command fails on a clean checkout, STOP. Report the failure and do not start editing.

## 3. Non-negotiable constraints

**The workspace is read-only.** `src/blockly.ts:8` sets `readOnly: true`, `:6` sets `renderer: "zelos"`, `:7` sets `theme: pybricksTheme`, `:9` sets `trashcan: false`. Do not add a toolbox, flyout, or mutator UI that assumes editing. Consequence: Blockly suppresses gesture-driven `SELECTED` events on mouse click, which is why `src/main.ts:149-165` reads clicks off the SVG instead.

**Monaco is imported through the API-only entry point.** `src/editor.ts:1` is `import * as monaco from "monaco-editor/editor/editor.api.js";`. Use that specifier. Do not import the `monaco-editor` root or `monaco-editor/esm/vs/editor/editor.main.js`; those pull in workers and break the single-file build. There is no `MonacoEnvironment` or `getWorker` anywhere in `src/`. Keep it that way.

**The build must stay a single file.** `vite.config.ts:2` imports `viteSingleFile`, `:5` registers it, and `:7-9` inline everything (`assetsInlineLimit`, `cssCodeSplit: false`, `copyPublicDir: false`). The shipped artifact is one `dist/index.html` opened via `file://`. Anything that emits a separate asset or a worker breaks the product.

**Source ranges are direct block properties, not `extraState`.** `src/walk.ts:1121-1122` assigns `ranged.sourceStart` and `ranged.sourceEnd` on the block after `initSvg()`. `src/main.ts:136-142` and `:198-201` read them off the block. Do not move them into `extraState` or `saveExtraState`.

**`pybricks_setup` is skipped in both sync directions.** `src/main.ts:132` returns early in `revealBlockSource`; `src/main.ts:205` filters it out of the reverse-sync candidate list. The hat spans the whole file (`src/walk.ts:1057-1058`, `sourceStart: 0`, `sourceEnd: source.length`), so highlighting it is noise.

**Import blocks carry a second, wider range.** `src/walk.ts:863-864` sets `statementStart`/`statementEnd` to the whole `from ... import ...` statement while `sourceStart`/`sourceEnd` cover only the name plus alias. `createBlock` copies them at `src/walk.ts:1127-1128`; `src/main.ts:233-235` uses them as the fallback when the cursor sits on `from`, `import`, or a comma.

**`multitask` uses `loadExtraState({ taskCount })`.** `src/walk.ts:1105-1110` calls it before `initSvg()`; the mutator in `src/blocks/multitask.ts:38-40` creates the `TASK0..TASKn` statement inputs. `src/walk.ts:759` sets `taskCount: Math.max(1, arguments_.length)`. Any new mutator block must follow the same order: load state, then `initSvg()`.

**Every block type must be registered before it is rendered.** Block definitions live in `src/blocks/*.ts` and are imported for side effects at the top of `src/main.ts:5-18`. A new block file that is not imported there will throw `Unknown block type` at render time. The registered types are `pybricks_setup`, `pybricks_task`, `pybricks_function`, `pybricks_call`, `pybricks_method_call`, `pybricks_await`, `pybricks_multitask`, `pybricks_import`, `pybricks_import_as`, `pybricks_var_reporter`, `pybricks_var_declare`, `pybricks_var_set`, `pybricks_comment`, `pybricks_pass`, `pybricks_raw_code`, `pybricks_hub`, `pybricks_motor_setup`, `pybricks_drivebase_setup`, `pybricks_drive_move`, `pybricks_drive_reset`, `pybricks_drive_use_gyro`, `pybricks_drive_configure`, `pybricks_motor_run_target`, `pybricks_motor_run_angle`, `pybricks_motor_run_until_stalled`, `pybricks_motor_reset_angle`, `pybricks_motor_stop`.

**Colours come from the block definition, not the theme.** Each `jsonInit` sets a literal `colour` (for example `#4c97ff` in `src/blocks/driveBase.ts:35`). `src/theme.ts` only supplies `blockStyles` for Blockly's own blocks and the workspace background. Changing a block's colour means editing its `jsonInit`, and `docs/BLOCK_DESIGN.md` must be updated in the same commit.

**The editor is read-only in two places.** `src/editor.ts:109-110` sets `readOnly: true` and `domReadOnly: true`. Do not remove either; the tool has no write path back to Python.

**`automaticLayout` is off.** `src/editor.ts:114` sets `automaticLayout: false`, so every layout change must call `editor.layout()` explicitly. `src/main.ts` does this on the toggle (`:127`), the splitter drag (`:289`), and the `ResizeObserver` (`:311`). If you add a container that changes size, call `editor.layout()` and `Blockly.svgResize(workspace)`.

## 4. Fragile code — read before modifying

**`collectBody` (`src/walk.ts:929`).** There is no `lastBlock` variable. Inline comments attach through `statements.at(-1)!.commentText = ...` at `src/walk.ts:956`, guarded by `statements.length > 0` at `:955`. Keep that guard; never index without it. The `at(-1)` target is the last _descriptor_, not the last rendered block: `drive.settings(...)` expands to up to four descriptors and `multitask` is one descriptor with nested inputs, so an inline comment can attach to a block that is not visually above it. Do not reorder pushes to "fix" this without a test.

**Docstring consumption (`src/walk.ts:985-1000`).** The first bare string expression in a body becomes `commentText` on the parent block and is consumed. `docstringConsumed` is set for every non-comment statement. Do not reset it mid-body.

**Comment bubble click path (`src/main.ts:149-165`).** There is no `.blocklyCommentIcon` check. The handler walks up from `event.target` to the nearest `data-id` ancestor. A comment bubble renders outside the block's `<g data-id>`, so clicking a bubble finds no block and falls into `editor.clearSelection()` at `:159`. Do not add a comment-specific branch without first confirming the bubble's DOM is inside the block group in the current Blockly version.

**Reverse sync (`src/main.ts:190-256`).** 50 ms debounce at `:195`, then: (1) narrow ranges — blocks whose `sourceStart..sourceEnd` contains the offset, sorted by smallest range then earliest start (`:207-226`); (2) if none, `statementStart..statementEnd` ranges sorted by `sourceStart` (`:230-239`); (3) `workspace.highlightBlock(id)` with `lastHighlightedBlockId` tracking so the previous glow is cleared (`:243-255`). `highlightBlock` does not fire `SELECTED`, so this cannot loop. Do not replace it with `select` or `setSelected`.

**Forward sync (`src/main.ts:149-182`).** Mouse clicks resolve from the SVG `data-id` attribute, not from Blockly events, because `readOnly` suppresses gesture `SELECTED`. Keyboard navigation still emits `SELECTED` and is handled at `:167`. `revealBlockSource` (`:130`) skips the hat and calls `editor.revealRange`. `revealRange` must not call `editor.focus()` (`src/editor.ts:137`) — it steals focus from Blockly.

**`materialize` (`src/walk.ts:1187`).** It measures `workspace.getBlocksBoundingBox()` before creating each block so a floating function lands below existing content. Keep the measure-then-create order.

**`applyFieldValue` (`src/walk.ts:1071`).** It falls back to the shadow block when the field does not exist. Literal arguments live in `fields` under the input name and land on the `math_number` shadow. Do not add a field whose name collides with a value input.

**Upload merge (`src/main.ts:71-110`).** `hasUploaded` (`:37`) decides whether the first upload replaces the fixtures or merges into them. The first upload starts from `{}`; later uploads spread `currentFiles` (`:77`). Do not change this to always-merge or always-replace without updating the sidebar behaviour and testing both paths.

**File switching (`src/main.ts:60-69`).** `onSelect` calls `workspace.clear()`, then `renderFile`, then `editor.setValue`, then `setActive`. The order matters: `renderFile` measures the workspace bounding box, so it must run on a cleared workspace. Never render into a workspace that still holds the previous file.

**Theme persistence (`src/main.ts:274`, `:281`).** The theme is stored in `localStorage` under the key `theme` and applied on load. `applyTheme` toggles `body.dark`, calls `workspace.setTheme`, `workspace.render`, and `editor.setTheme`. All three are required; skipping `workspace.render()` leaves stale block colours.

**`resolveProject` is recomputed on upload only.** `src/main.ts:53` resolves once at startup and `:83` re-resolves after an upload. If you add a code path that mutates `currentFiles`, re-run `resolveProject` or the object kinds go stale.

## 5. Testing

- `src/acceptance.test.ts` is the product contract. It parses `fixtures/robot.py` and `fixtures/exampleattach.py`, runs `collectBlocks`, and asserts `countRaw(...) === 0` for both. `countRaw` recurses through `inputs`. If you add a Python construct to those fixtures, you must add a block for it.
- `src/walk.test.ts` runs `renderFile` against a stub workspace and asserts a top-level `run_task(main())` becomes a `pybricks_call` with `NAME === "run_task"`.
- `src/resolve.test.ts` covers cross-file resolution: aliased `Motor`, `DriveBase`, async-function kinds, `multitask` from `pybricks.tools`, local constants.
- `src/symbols.test.ts` covers `buildSymbolTable` and `buildObjectTable` on `robot.py`.
- `src/parser.test.ts` is a smoke test: `@lezer/python` parses all four fixtures without throwing.

Run `npm run test` before and after every change. Never commit red. `npm run build` must also pass; `tsc` runs first with `noUnusedLocals` and `noUnusedParameters` enabled, so an unused import fails the build even though Vitest would pass.

When you add a block, add a test that proves it. The cheapest place is `src/walk.test.ts` (stub workspace, assert the descriptor or block type) or `src/acceptance.test.ts` (add the construct to a fixture and keep the raw count at zero). Do not add a test that only asserts a snapshot of `console.log` output; `src/parser.test.ts` and `src/symbols.test.ts` log for debugging but assert real values.

## 6. Commit conventions

Follow `docs/GIT.md`. Message shape is `Step NN: <one line>`, no trailing period, no `feat:` prefix. Checkpoints use `Step NN (WIP): <what works so far>`. Commit only when the browser renders correctly, tests pass, and the console is clean.

## 7. What "done" means for a change

1. `npm run test` passes — 6/6.
2. `npm run build` succeeds and writes `dist/index.html`.
3. In the browser, the changed behaviour works AND a previously-working behaviour still works: switch files, toggle the code panel, toggle the theme, click a block, click in Monaco.
4. `dist/index.html` opens via `file://` with no console errors.
