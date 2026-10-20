# Roadmap

Steps are listed in build order. Each step is a self-contained Copilot prompt.
Mark a step ✅ only when it renders correctly in the browser and tests pass.

## Parsing foundation

- ✅ **Steps 1–4** — Vite/TypeScript scaffold, `@lezer/python` parser, symbol table, object table, cross-file resolution

## Blockly rendering

- ✅ **Steps 5–10** — Blockly shell, raw-code walker, `set up` hat, task/function blocks, import blocks, call blocks + await wrapper

## Pybricks blocks

- ✅ **Step 11a** — DriveBase blocks: `straight`, `turn`, `reset`, `use_gyro`
- ✅ **Step 11a.5** — DriveBase `settings()` → four chained `configure` blocks
- ✅ **Step 11b** — Motor blocks: `run_target`, `run_angle`, `run_until_stalled`, `reset_angle`, `stop`
- ✅ **Step 12** — Variable blocks: `create variable X = value`, `set X to value`
- ✅ **Step 13** — Comment blocks (grey) + inline comment attachment
- ✅ **Step 14** — Hardware setup blocks: `PrimeHub`, `Motor`, `DriveBase`
- ✅ **Step 14.5** — Hardware wording pass + DriveBase `NAME` field
- ✅ **Step 15** — Top-level expressions verified, star-args fallback confirmed
- ✅ **Step 16** — Variable chips in Pybricks block args
- ✅ **Step 16.5** — Chip text colour, cursor polish
- ✅ **Step 17** — `multitask` block with statement slots (+ fixture rename)
- ✅ **Step 17.5** — `pass` block
- ✅ **Step 18** — Docstrings as comment icons on the parent block
- ✅ **Step 18.5** — Acceptance test: 0 raw blocks in `robot.py` and `exampleattach.py`

---

## v1 — production-ready viewer

**Goal:** a working viewer on real deployment targets. `robot.py` and `exampleattach.py`
render with zero raw blocks. The user can switch files, upload their own project, open
the app offline as a single `.html`, and reach a hosted URL.

### Closeout

- ✅ **Step 18.75** — Update `docs/OVERVIEW.md` with revised v1 criterion
- ✅ **Step 19** — Resizable file sidebar; refresh fixtures to current project files; opens on `main.py`
- ✅ **Step 20** — Single-file HTML export (`vite-plugin-singlefile`). **872 kB `index.html` opens via `file://`.**
- ✅ **Step 21** — File upload and drag-and-drop to sidebar; first upload clears fixtures, subsequent uploads merge

### Deploy

- ✅ **Step 22** — Docker deployment files (`Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`). **No local build** — LXC builds on `docker compose up --build`.
- ✅ **Step 22.5** — Release: `npm version 1.0.0`, tag `v1.0.0`, push to GitHub. Then LXC does `git checkout v1.0.0 && docker compose up -d --build`.
- ⬜ **Step 23** — NPM: create proxy host pointing at `LXC-IP:8080`, SSL via Let's Encrypt, confirm the public URL loads.
- ⬜ **Step 24** — Verify on real targets: school Windows (single-file `index.html` via USB/email, and hosted URL if domain isn't blocked) and Ubuntu Chromebook (both single-file and hosted URL).

**v1 is done when** any of these works for your teammate:

- The single-file `index.html` opens via `file://` on a school Windows machine, files upload, blocks render
- The hosted URL (via NPM) loads and works the same way

### Deferred from v1 (moved to v1.25 or v2)

- **PWA** — single-file already covers offline; PWA adds install-from-domain which needs Docker first. Reassess after Docker + school test if a hosted installable app is still wanted.
- **Tauri desktop** — only relevant if school Windows blocks `file://` execution. If school test fails, escalate to v2 planning.

---

## v1.25 — editor integration

**Goal:** read-only Monaco panel beside the blocks, with bidirectional highlighting. This is the feature that makes the tool more than a viewer.

### Prerequisite (do first, or highlighting drifts)

- ⬜ **Step 25** — Refactor `walk.ts` to attach `{ sourceStart, sourceEnd }` to every block via `extraState`. Also upgrade the acceptance test to use `collectBlocks` (deferred from Step 18.5).

### Monaco panel

- ⬜ **Step 26** — Add Monaco as a read-only panel to the right of the blocks, with a toggle button. Plain syntax highlighting, no editing.
- ⬜ **Step 27** — Click a block → Monaco selects and reveals its source range.
- ⬜ **Step 28** — Click in Monaco → Blockly highlights the block whose range contains the cursor.

### Tabs (only if sidebar alone isn't enough)

- ⬜ **Step 29** — Optional: add horizontal tabs on top of the sidebar (VS Code style). Do this only if the sidebar becomes painful with more files.

---

## v1.5 — make infrastructure legible

**Goal:** `run.py` and `main.py` render mostly as blocks.

### Control flow

- ⬜ **Step 30** — `for` loops (needed for `run.py`'s mission loop)
- ⬜ **Step 31** — `while` loops (needed for `main.py`'s menu loop)
- ⬜ **Step 32** — `if`/`elif`/`else` upgrade: `in` operator support

### Expression depth

- ⬜ **Step 33** — Nested member expression dispatch (enables `hub.display.image`, `hub.buttons.pressed`, `hub.light.on`)
- ⬜ **Step 34** — `return` block, `pass` inside `try/except`

### Hub API blocks

- ⬜ **Step 35** — Hub display blocks: `.image`, `.off`, `.char`, `.text`
- ⬜ **Step 36** — Hub button block: `.pressed`
- ⬜ **Step 37** — Hub light blocks: `.on`, `.off`
- ⬜ **Step 38** — `wait` block
- ⬜ **Step 39** — `try/except` blocks

---

## v2 — editable blocks and native app

- Editable blocks → Python generation (round-trip)
- Tauri desktop build (per-user NSIS install, no admin) — if school Windows policy allows running unsigned exes
- Per-function block types (like Pybricks Code's palette)
- Custom field renderers for pink chips
- Multiline raw-code rendering
- Lists as real blocks
