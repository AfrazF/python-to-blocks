# Roadmap

Steps are listed in build order. Each step is a self-contained Copilot prompt.
Mark a step ✅ only when it renders correctly in the browser and tests pass.

## Parsing foundation

- ✅ **Step 1** — Vite + TypeScript scaffold, `@lezer/python` parser smoke test on the three fixtures
- ✅ **Step 2** — Symbol table (`buildSymbolTable`): functions, async-functions, variables
- ✅ **Step 3** — Object table (`buildObjectTable`): Motor, DriveBase, PrimeHub, literals
- ✅ **Step 4** — Cross-file resolution (`resolveProject`): aliased imports, project imports, external imports

## Blockly rendering

- ✅ **Step 5** — Blockly shell: Zelos renderer, Pybricks theme, zoom, dotted grid
- ✅ **Step 6** — Raw-code block + walker: top-level statements as one stack
- ✅ **Step 7** — `set up` hat (orange, one per file)
- ✅ **Step 8** — Task (purple) and function (pink) blocks with nested bodies
- ✅ **Step 9** — Import blocks (one per imported name, aliases supported)
- ✅ **Step 10** — Call blocks (pink) and await wrapper (purple)

## Pybricks blocks

- ✅ **Step 11a** — DriveBase blocks: `straight`, `turn`, `reset`, `use_gyro`
- ✅ **Step 11a.5** — DriveBase `settings()` → four chained `configure` blocks
- ✅ **Step 11b** — Motor blocks: `run_target`, `run_angle`, `run_until_stalled`, `reset_angle`, `stop`
- ✅ **Step 12** — Variable blocks: `create variable X = value`, `set X to value`
- ✅ **Step 13** — Comment blocks (grey) + inline comment attachment
- ⬜ **Step 14** — Hardware setup blocks: `PrimeHub`, `Motor`, `DriveBase` constructors
- ⬜ **Step 15** — Top-level expressions: `run_task(main())`, `hub_menu(*labels)`
- ⬜ **Step 16** — Expression refactor: args become `input_value` slots, variable reporters as chips
- ⬜ **Step 17** — `multitask` block: multiple statement slots, `all`/`any` dropdown
- ⬜ **Step 18** — `wait` block (Flow orange)
- ⬜ **Step 19** — Docstrings: `"""..."""` at top of file → comment on `set up` hat
- ⬜ **Step 20** — `main.py` constructs: list comprehension, tuple unpacking, `while` loop

## Application chrome

- ⬜ **Step 21** — Tabs UI: one workspace per file, switch between files
- ⬜ **Step 22** — File upload: drag-and-drop or file picker, resolve whole project
- ⬜ **Step 23** — Docker deploy: nginx container on dev LXC, NPM proxy
- ⬜ **Step 24** — Chromebook verification: real device test, performance check

## v1 done when

`robot.py`, `main.py`, and `examplerun.py` all render with **zero raw-code blocks**
(per `docs/OVERVIEW.md`), plus a Vitest test that checks this on the three fixtures.

## v2 ideas (post-v1)

- Editable blocks → Python generation (round-trip)
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chip styling
- Multiline raw-code rendering