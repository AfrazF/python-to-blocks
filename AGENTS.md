# AGENTS.md

Rules for AI agents working in this repository. Read this file before editing anything.

## Milestones shipped

- **v1.0.0** (2026-10-22) — read-only viewer, single-file HTML, Docker deployment
- **v1.1.0** (2026-10-24) — Monaco panel, bidirectional highlighting, multitask argument comments, cascade glow

See `docs/ROADMAP.md` for v1.5 in-progress and v2/v3 planning.

## 1. What this project is, and what it is not

A read-only viewer (v1.1.0 shipped; v2 adds editing behind a feature flag). It parses Pybricks Python (LEGO SPIKE Prime, FLL robots) with `@lezer/python` and renders it as Blockly blocks on the Zelos renderer, resolving imports across files so that `attachment1 as attachment_a` is known to be a `Motor`. It is not an editor: there is no Python generation, no round-trip, no block editing, no Monaco workers, no icons on blocks, and no drag-to-create. Anything unmapped becomes a `pybricks_raw_code` block and is never dropped. Scope is locked in `docs/OVERVIEW.md`; block wording and colours are locked in `docs/BLOCK_DESIGN.md`.

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

## Read-only is v1.1.0 — v2 uses a feature flag, not a separate branch

`src/blockly.ts` sets `readOnly: true`. `src/editor.ts` sets `readOnly: true, domReadOnly: true`. **This remains the default on `main` throughout v2 development.**

v2 (editable blocks) is gated behind a URL parameter: `?editable=1`. When the param is present, the app:

- Sets `readOnly: false` on the Blockly workspace
- Shows a toolbox / palette
- Enables gesture editing (drag, connect, delete)

**The default state of `main` never changes during v2.** Users who hit the app without `?editable=1` get the exact v1.1.0 read-only experience. Users who add the param get the in-progress v2 experience.

**Why not a `v2-dev` branch:** A separate long-lived branch means two protected branch heads, two CI targets, PRs against the wrong base, and constant rebasing. The feature flag avoids all of it — v2 features land on `main` behind the flag, one PR at a time, exactly like v1.5.

**When v2 ships:** flip the default (`readOnly: true` → `readOnly: false`, param becomes `?readonly=1` for legacy behavior). One commit, no branch merge, no ruleset change.

**Do not:** create a `v2-dev` branch. Do not set `readOnly: false` unconditionally. Do not add a second ruleset. Any v2 PR should preserve the flag gate.

See `docs/ROADMAP.md` under "v2 — Editable IDE" for the full scope.

## 3. Non-negotiable constraints

**The workspace is read-only by default.** `src/blockly.ts` sets `readOnly: true`, `renderer: "zelos"`, `theme: pybricksTheme`, and `trashcan: false`. Do not add a toolbox, flyout, or mutator UI that assumes editing on the default path — v2 editing is gated behind `?editable=1` (see "Read-only is v1.1.0" above). Consequence: Blockly suppresses gesture-driven `SELECTED` events on mouse click, which is why the click listener in `src/main.ts` reads clicks off the SVG instead.

**Monaco is imported through the API-only entry point.** `src/editor.ts` starts with `import * as monaco from "monaco-editor/editor/editor.api.js";`. Use that specifier. Do not import the `monaco-editor` root or `monaco-editor/esm/vs/editor/editor.main.js`; those pull in workers and break the single-file build. There is no `MonacoEnvironment` or `getWorker` anywhere in `src/`. Keep it that way.

**The build must stay a single file.** `vite.config.ts` imports `viteSingleFile`, registers it, and inlines everything (`assetsInlineLimit`, `cssCodeSplit: false`, `copyPublicDir: false`). The shipped artifact is one `dist/index.html` opened via `file://`. Anything that emits a separate asset or a worker breaks the product.

**Source ranges are direct block properties, not `extraState`.** `createBlock` in `src/walk.ts` assigns `ranged.sourceStart` and `ranged.sourceEnd` on the block after `initSvg()`. `revealBlockSource` and `onCursorChange` in `src/main.ts` read them off the block. Do not move them into `extraState` or `saveExtraState`.

**`pybricks_setup` is skipped in both sync directions.** `revealBlockSource` in `src/main.ts` returns early for it, and `onCursorChange` filters it out of the reverse-sync candidate list. The hat spans the whole file (`collectBlocks` in `src/walk.ts` sets `sourceStart: 0`, `sourceEnd: source.length`), so highlighting it is noise.

**Import blocks carry a second, wider range.** `collectImportBlocks` in `src/walk.ts` sets `statementStart`/`statementEnd` to the whole `from ... import ...` statement while `sourceStart`/`sourceEnd` cover only the name plus alias. `createBlock` copies them; `onCursorChange` in `src/main.ts` uses them as the fallback when the cursor sits on `from`, `import`, or a comma.

**`multitask` uses `loadExtraState({ taskCount })`.** `createBlock` in `src/walk.ts` calls it before `initSvg()`; the mutator in `src/blocks/multitask.ts` creates the `TASK0..TASKn` statement inputs. `collectExpressionStatement` sets `taskCount: Math.max(1, argumentNodes.length)`. Any new mutator block must follow the same order: load state, then `initSvg()`.

**Every block type must be registered before it is rendered.** Block definitions live in `src/blocks/*.ts` and are imported for side effects at the top of `src/main.ts`. A new block file that is not imported there will throw `Unknown block type` at render time. The registered types are `pybricks_setup`, `pybricks_task`, `pybricks_function`, `pybricks_call`, `pybricks_method_call`, `pybricks_await`, `pybricks_multitask`, `pybricks_import`, `pybricks_import_as`, `pybricks_var_reporter`, `pybricks_var_declare`, `pybricks_var_set`, `pybricks_comment`, `pybricks_pass`, `pybricks_raw_code`, `pybricks_hub`, `pybricks_motor_setup`, `pybricks_drivebase_setup`, `pybricks_drive_move`, `pybricks_drive_reset`, `pybricks_drive_use_gyro`, `pybricks_drive_configure`, `pybricks_motor_run_target`, `pybricks_motor_run_angle`, `pybricks_motor_run_until_stalled`, `pybricks_motor_reset_angle`, `pybricks_motor_stop`.

**Colours come from the block definition, not the theme.** Each `jsonInit` sets a literal `colour` (for example `#4c97ff` in `src/blocks/driveBase.ts`). `src/theme.ts` only supplies `blockStyles` for Blockly's own blocks and the workspace background. Changing a block's colour means editing its `jsonInit`, and `docs/BLOCK_DESIGN.md` must be updated in the same commit.

**The editor is read-only in two places.** `createEditor` in `src/editor.ts` sets `readOnly: true` and `domReadOnly: true`. Do not remove either; the tool has no write path back to Python.

**`automaticLayout` is off.** `createEditor` in `src/editor.ts` sets `automaticLayout: false`, so every layout change must call `editor.layout()` explicitly. `src/main.ts` does this on the toggle, the splitter drag, and the `ResizeObserver`. If you add a container that changes size, call `editor.layout()` and `Blockly.svgResize(workspace)`.

- **`readOnly: true` on Blockly and Monaco** — enforced by v1.1.0. See "Read-only is v1.1.0 — v2 uses a feature flag, not a separate branch" above before considering any change.

## 4. Fragile code — read before modifying

**`collectBody` (`src/walk.ts`).** There is no `lastBlock` variable. Inline comments attach through `statements.at(-1)!.commentText = ...`, guarded by `statements.length > 0`. Keep that guard; never index without it. The `at(-1)` target is the last _descriptor_, not the last rendered block: `drive.settings(...)` expands to up to four descriptors and `multitask` is one descriptor with nested inputs, so an inline comment can attach to a block that is not visually above it. Do not reorder pushes to "fix" this without a test.

**Docstring consumption (`collectBody` in `src/walk.ts`).** The first bare string expression in a body becomes `commentText` on the parent block and is consumed. `docstringConsumed` is set for every non-comment statement. Do not reset it mid-body.

**Comment bubble click path (`src/main.ts`).** There is no `.blocklyCommentIcon` check. The handler walks up from `event.target` to the nearest `data-id` ancestor. A comment bubble renders outside the block's `<g data-id>`, so clicking a bubble finds no block and falls into `editor.clearSelection()`. Comment-icon clicks open the bubble through Blockly's native handler and fall through to `clearSelection()` for the Monaco side. **Do not** add a comment-icon branch that calls `editor.revealRange()` — it steals focus and closes the bubble. Do not add a comment-specific branch without first confirming the bubble's DOM is inside the block group in the current Blockly version.

**Reverse sync (`onCursorChange` in `src/main.ts`).** 50 ms debounce, then: (1) narrow ranges — blocks whose `sourceStart..sourceEnd` contains the offset, sorted by smallest range then earliest start; (2) if none, `statementStart..statementEnd` ranges sorted by `sourceStart`; (3) `workspace.highlightBlock(id)` with `lastHighlightedBlockId` tracking so the previous glow is cleared. `highlightBlock` does not fire `SELECTED`, so this cannot loop. Do not replace it with `select` or `setSelected`.

**Forward sync (`src/main.ts`).** Mouse clicks resolve from the SVG `data-id` attribute, not from Blockly events, because `readOnly` suppresses gesture `SELECTED`. Keyboard navigation still emits `SELECTED` and is handled by the `addChangeListener` branch. `revealBlockSource` skips the hat and calls `editor.revealRange`. `revealRange` must not call `editor.focus()` — it steals focus from Blockly.

**`materialize` (`src/walk.ts`).** It measures `workspace.getBlocksBoundingBox()` before creating each block so a floating function lands below existing content. Keep the measure-then-create order.

**`applyFieldValue` (`src/walk.ts`).** It falls back to the shadow block when the field does not exist. Literal arguments live in `fields` under the input name and land on the `math_number` shadow. Do not add a field whose name collides with a value input.

**Upload merge (`src/main.ts`).** `hasUploaded` decides whether the first upload replaces the fixtures or merges into them. The first upload starts from `{}`; later uploads spread `currentFiles`. Do not change this to always-merge or always-replace without updating the sidebar behaviour and testing both paths.

**File switching (`onSelect` in `src/main.ts`).** It calls `workspace.clear()`, then `renderFile`, then `editor.setValue`, then `setActive`. The order matters: `renderFile` measures the workspace bounding box, so it must run on a cleared workspace. Never render into a workspace that still holds the previous file.

**Theme persistence (`applyTheme` in `src/main.ts`).** The theme is stored in `localStorage` under the key `theme` and applied on load. `applyTheme` toggles `body.dark`, calls `workspace.setTheme`, `workspace.render`, and `editor.setTheme`. All three are required; skipping `workspace.render()` leaves stale block colours.

**`resolveProject` is recomputed on upload only.** `src/main.ts` resolves once at startup and re-resolves after an upload. If you add a code path that mutates `currentFiles`, re-run `resolveProject` or the object kinds go stale.

### Added in v1.1.0 (2026-10-24)

**`highlightSubtree` in `src/main.ts`.** It recursively glows a block and all of its descendants, but skips the block's next-sibling. `getChildren()` returns both input children and the next statement, and the next statement is a sibling, not a descendant. The `includeNext` flag distinguishes root calls (`false`) from recursive calls (`true`). **Do not** collapse this to a bare `block.getChildren()` loop without filtering — a task block would swallow every subsequent top-level statement into its glow.

**`revealRange` in `src/editor.ts`.** It builds `new monaco.Selection(endLine, endCol, startLine, startCol)`. That inversion is intentional: anchor at the end, cursor at the start. It is what makes `await home(...)` reverse-sync to the await wrapper instead of the inner `home(...)` call. **Do not** "fix" the argument order back to `(start, end)` — that reintroduces the await bug.

**`clearSelection` in `src/editor.ts`.** It suppresses `onCursorChange` for 100 ms after collapsing the selection (`suppressCursorChangesUntil`). The collapse is itself a programmatic cursor move, so without the guard reverse sync would see that offset, find the block still sitting there, and re-glow the block that was just cleared. **Do not** remove the suppression without a replacement — the "clear on background click" behaviour depends on it.

**`getMultitaskComments` in `src/walk.ts`.** It returns `{ multitask: string[], perArg: string[][] }`. Argument matching is by **start offset** against `getCallArgumentNodes`, not by node-type counting. Keyword args (`race=True`) appear in the `ArgList` as three separate children (`VariableName`, `AssignOp`, `Boolean`), so node-type counting would treat them as one argument and misalign every subsequent comment. **Do not** simplify this to `child.name === "CallExpression"` counting.

**`block.removeIcon(Blockly.icons.IconType.MUTATOR)` in `src/walk.ts`.** This is the correct API for removing the mutator gear from the multitask block in Blockly 13. `IIcon` has no `setVisible()` method; `getIcon().setVisible(false)` throws at runtime. **Do not** attempt `setVisible` approaches.

**The click listener in `src/main.ts` is on `.blocklyMainBackground`** in addition to the SVG canvas listener. The background rect lives in `.blocklyWorkspace`, which is a **sibling** of `.blocklyBlockCanvas`, not a child. A listener only on the canvas misses empty-background clicks. **Do not** consolidate to a single listener on the canvas.

## 5. Testing

- `src/acceptance.test.ts` is the product contract. It parses all four fixtures (`robot.py`, `exampleattach.py`, `main.py`, `run.py`), runs `collectBlocks`, and asserts: `robot.py` === 0 raw, `exampleattach.py` === 0 raw, `main.py` <= BASELINE_MAIN, `run.py` <= BASELINE_RUN. Baselines are current counts, not goals — lower them in the same PR when a later step reduces the count; never raise them. Baselines at Step 36: main.py=7, run.py=4. Goal after Step 38+41: main.py=1, run.py=0.
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

## v2 scope decisions (locked)

These were decided 2026-10-24 and should not be re-litigated without cause:

- **Architecture:** Hybrid. Single-file `index.html` = viewer-only (no pyodide). Hosted URL = full intellisense. Feature-detected at runtime.
- **Sequence:** v2a (Monaco+tabs) → v2b (editable blocks) → v2c (intellisense) → v2d (polish) → v2e (full Pybricks API coverage) → v2 wrap-up (PWA + Tauri). Do not skip ahead. v2e was added 2026-10-25; full API coverage and PID blocks moved out of v3 because they are block work, not hardware work.
- **v2b is the biggest cluster** (6–10 weeks). Full round-trip editing. If v2b.5 (Python→blocks reverse sync) proves infeasible in scope, the fallback is blocks→Python only — a documented reduction, not a failure.
- **Tabs pattern:** sidebar keeps file list (like VS Code Explorer), tabs show open files. Clicking a file in the sidebar opens it as a tab; clicking again if already open focuses that tab.
- **Comment revamp:** TurboWarp-style (speech bubble shape, subtle shadow, small rounded corners), not Zelos-themed, not MD3.
- **Token colors:** The code panel uses **Atom One Dark / Atom One Light** (vendored JSON in `src/themes/`). The original "category-level" idea (making `drive.straight` blue) was dropped because Monaco's default tokenizer cannot distinguish method calls from variable names, and Atom One Dark is the preferred daily-driver theme. Full category-level coloring is deferred to **v2d.17** (custom Monarch tokenizer).
- **Field shapes are specified in `docs/FIELD_DESIGN.md`.** That file is the single source of truth: the two lightness rules, the two dropdown styles, the pill-with-white-square wrapper, the verified block examples, the field lookup table, and the v2b.2b implementation recipe. Do not restate field rules anywhere else. v1.5 ships every block with a plain white `field_input`; v2b.2b converts them following that recipe.
- **Every new block follows that design.** A block added in v1.5 or v2e ships `field_input` in v1.5 and is converted in v2b.2b per the recipe. Do not hand-roll a field shape in a new block before v2b.2b lands.
- **The variable chit is one chit with a dropdown, not one chit per variable** (v2d.6b). `{variable icon} | (WHEEL_DIAMETER ▾)` — the dropdown lists every variable in scope and picking one changes the chit in place. v1.1.0 keeps the current `pybricks_var_reporter` block with a fixed `NAME` field; the single-chit dropdown is a v2 change. Because it is a dropdown, it can be dropped into any slot regardless of that slot's shape. **Split from v2d.6a** (argument dropdowns, one chit per variable) because it needs the walker to pass the full variable list to every reporter, live dropdown updates when a variable is added, and serialization that stores a selection reference rather than a name.
- **PID blocks (v2e.1) mirror the `drive.settings()` pattern.** One block per parameter, a dropdown picks the parameter, a circular value slot holds the number. `collectDriveSettingsBlocks` in `src/walk.ts` is the dispatch shape to copy. Friendly parameter names (proportional/integral/derivative/integral deadzone/integral rate) map to `kp`/`ki`/`kd`/`integral_deadzone`/`integral_rate`. PID getters (`kp, ki, kd = ...pid()`) stay raw until v2e.2 — they need tuple unpacking that `collectVariableBlock` does not support.
- **Intellisense packages are npm-wrapped pyodide wheels** (~29 MB combined). Not pure JS. Cache after first fetch. Excluded from single-file `file://` build.

## Roadmap discipline

Every step prompt updates `docs/ROADMAP.md` before the PR is opened:

1. Flip the corresponding step to ✅ if the work merged to `main`.
2. Verify the ✅ against `git log` — do not check off a step whose commit isn't in the log.
3. Add the file citation (e.g. `src/blocks/for.ts`, `collectForBlock`) next to the ✅.
4. If a step was repurposed mid-stream, update its description to match what was actually built. Do not leave stale wording.

PR descriptions must list every roadmap step flipped, with the commit SHA.
