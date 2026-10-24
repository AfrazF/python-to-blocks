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
- v1 is done when **robot.py** and **exampleattach.py** render with **0 raw-code blocks**, enforced by `src/acceptance.test.ts`. `run.py` and `main.py` are infrastructure and may contain raw blocks in v1 (v1.5 adds control-flow blocks to close this).
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

### Tests

- 6 Vitest tests pass, including the zero-raw-block acceptance test
- `npm run build` succeeds; Vite's large-chunk advisory (Blockly ~860 kB) is accepted

### Next (v1 closeout)

- **Step 22** — Docker files (`Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`); no local build
- **Step 22.5** — `npm version 1.0.0`, tag `v1.0.0`, push
- **Step 23** — NPM proxy host → `LXC-IP:8080`, SSL via Let's Encrypt
- **Step 24** — Verify on school Windows (single-file) and Ubuntu Chromebook (both paths)

### Post-v1

- **v1.25** — Monaco read-only panel with bidirectional highlighting; refactor `walk.ts` to carry `sourceStart`/`sourceEnd`
- **v1.5** — Control flow, nested member dispatch, hub display/button/light blocks
- **v2** — Sequenced in five clusters: v2a (Monaco+tabs), v2b (editable blocks, round-trip), v2c (intellisense via pyodide), v2d (polish: icons, comments, snap, categories), v2 wrap-up (PWA + Tauri). See docs/ROADMAP.md for full breakdown.

See `docs/ROADMAP.md` for full detail.
