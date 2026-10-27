# Python to Blocks — Overview

## Goal

A browser tool that shows Pybricks Python (LEGO SPIKE Prime, FLL robot) as Blockly blocks.
v1.x is read-only by default. Editing (v2) is gated behind a ?editable=1 URL parameter; read-only remains the default on main until v2 ships.
Mainly for a teammate who prefers blocks.

## Robot and code

- SPIKE Prime hub, Pybricks MicroPython, FLL robot.
- **robot.py**: hub, motors (left A, right B, attachment1 C, attachment2 D), DriveBase,
  speed presets `normal()` / `fast()` / `precise()`, `reset_drive()`, `async home(motor, speed, duty=40)`.
- **run.py**: shared boilerplate `async def run_missions(*missions)` — shows an icon, waits for a button, runs the mission. Wraps each mission in `try/except` for safe mid-competition failure.
- **attachment files** (`a1.py`, `a2.py`...): one per attachment. Each holds several `async def missionN()` functions and a `main()` that calls `run_missions(mission1, mission2, ...)`. Adding a mission means writing one function and adding one argument.
- **main.py**: menu that lists attachments. Uses a custom `pick()` loop instead of `hub_menu` so the next attachment is pre-selected after each run.
- Fixtures in `fixtures/` mirror these files. Update them whenever project code changes.

## v1 scope (locked)

- Parser: **@lezer/python** (verified 1.1.18, MIT, plain JS, no WASM).
- **Vite + TypeScript**, **Blockly (Zelos renderer)**, **Vitest** (dev only).
- Upload whole project, one sidebar item per file, one Blockly workspace per file.
- Blocks for Pybricks calls, own functions, variables, math, comments, tasks, and `multitask`. Control flow (`if`/`for`/`while`) and `try/except` are deferred to v1.5.
- Everything unmapped → raw-code block, kept exactly as written.
- v1.5 is done when `robot.py`, `exampleattach.py`, and `run.py` render with 0 raw blocks, and `main.py` renders with at most 1 (the tuple unpack, deferred to optional Step 38.5). Rule: no simple construct becomes a raw block. Simple = literal, variable reference, call, method call, binary arithmetic, enum reference, subscript, list literal. Anything more complex may remain raw until a later milestone.
- Separate test: `src/acceptance.test.ts` asserts zero raw blocks in `robot.py` and `exampleattach.py`. Currently uses an independent AST counter; v1.5 upgrades it to `collectBlocks` from `walk.ts` before the control-flow work.
- No Monaco, no text panel, no click-to-Python in v1.
- No icons on blocks in v1.

## Block rules

See **docs/BLOCK_DESIGN.md** for colors, node mappings, and verified-vs-inference markers.

## Cross-file resolution (the point of this tool)

Pybricks Code treats each file in isolation. We do not.

1. Parse **robot.py** first, build a symbol table (what `drive`, `attachment1`, `home`, etc. are).
2. When parsing an attachment file, resolve imports against that table.
3. So `from robot import attachment1 as attachment_a` means `attachment_a` is a Motor,
   and calls like `await home(...)` can find `home`'s parameter names from its `def`.

## Hosting

- Static build served by **nginx in Docker** on the dev LXC (Ubuntu, Docker + compose installed).
- NPM (Nginx Proxy Manager) runs on a different LXC/VM with Cloudflare DDNS; publishes a port, NPM points at it.
- Site is **open** (no access protection) — it is only a viewer.
- Code lives in a **private GitHub repo**.

## Workflow

- Claude plans and writes short prompts.
- **GitHub Copilot in VS Code** is the coding agent.
- **Qwen3.7 Flash** via Copilot BYO-key (agent mode; tool calling required). $1/day cap on the OpenRouter key.
- Fall back to **DeepSeek V4 Flash** for steps where Qwen produces broken code twice in a row.
- Beginner-readable TypeScript: clear names, small functions, comments where the logic is non-obvious.

## Status

### Done

- Parsing foundation (Steps 1–4)
- Blockly rendering (Steps 5–10)
- Pybricks blocks (Steps 11a–16.5)
- Restructure + `multitask` + `pass` + docstrings (Steps 17–18.5)
- Resizable sidebar + fixture refresh (Step 19)
- Single-file HTML export (Step 20) — 872 kB `index.html`, opens via `file://`
- File upload + drag-drop (Step 21) — first upload clears fixtures, subsequent merge
- Docker deployment + `v1.0.0` release (Steps 22–22.5)
- **v1.25 shipped as v1.1.0** — read-only Monaco panel, bidirectional highlighting, multitask argument comments, cascade glow (Steps 25a–28.5b)
- **v1.5 control flow** — `for`, `while`, `if`/`elif`/`else`, `try`/`except`, `return`/`raise` (Steps 30–34)
- **v1.5** — control-flow blocks (for, while, if/elif/else, try/except, return/raise) and hub display blocks. 0 raw blocks in robot.py, exampleattach.py, run.py. main.py keeps 1 raw block (tuple unpack, deferred). Shipped as v1.5.0.

### Tests

- 6 Vitest tests pass, including the zero-raw-block acceptance test
- `npm run build` succeeds; Vite's large-chunk advisory (Blockly ~860 kB) is accepted

### Next

- v1.5 complete. Next: v1.75 (UI polish) per docs/ROADMAP.md, then v2a–v2e.

### Post-v1

- **v2** — six clusters: v2a (Monaco+tabs), v2b (editable blocks, round-trip), v2c (intellisense via pyodide), v2d (polish: icons, comments, snap, categories), v2e (full Pybricks API coverage: PID, getters, sensors), v2 wrap-up (PWA + Tauri). See `docs/ROADMAP.md` for the full breakdown.

See `docs/ROADMAP.md` for full detail.
