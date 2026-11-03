# Python to Blocks

> **For AI agents:** read `AGENTS.md` before making any changes.

A read-only viewer that shows Pybricks Python (LEGO SPIKE Prime, FLL robots) as Pybricks-style Blockly blocks.

Built for teammates who prefer blocks, and for reading unfamiliar code fast.

**Editable blocks are in progress** behind the `?editable=1` URL flag. The default `main` stays read-only until v2 ships.

## Quick start

Download the latest `index.html` from [Releases](../../releases) → double-click → upload your `.py` files → see blocks.

No server, no install, works offline.

## What it does

- Parses any Python with `@lezer/python`
- Resolves imports across files (`attachment1 as attachment_a` → known Motor)
- Maps Pybricks calls (drive, motor, multitask) to real blocks
- Renders Pybricks-style custom fields — pill dropdowns, darker square fields, and white-in-pill value slots with unit suffixes (`mm`, `mm/s`, `°/s`, etc.)
- Monaco panel with bidirectional highlighting: click a block → its source line is selected; move the cursor → the block glows
- Editor and app chrome use Atom One Dark / Atom One Light, matching VS Code
- Everything unmapped falls back to a raw-code block (nothing is lost)
- Zero raw blocks in `robot.py` and `exampleattach.py` — enforced by `src/acceptance.test.ts`

**With `?editable=1`:**

- Blockly workspace becomes editable (drag, connect, delete)
- Spike Prime–style toolbox (62px category rail, colored bubbles, continuous flyout with hover preview)
- Custom fields on DriveBase, Motor, and Drive command blocks
- Editing is not yet round-trippable to Python — that's v2b.4+

## Development

```bash
npm install
npm run dev        # dev server
npm run test       # Vitest (7 tests)
npm run build      # single-file dist/index.html
```

## Status

**Shipped:**

- **v1.0.0** — read-only viewer, single-file HTML, Docker
- **v1.1.0** — Monaco panel, bidirectional highlighting
- **v1.5.0** — control flow blocks + hub display, 0 raw blocks in `robot.py` / `exampleattach.py` / `run.py`
- **v1.75.0** — Material Symbol canvas controls, morph animations, hide-blocks toggle

**In progress (v2):**

- **v2a** ✅ — Monaco tabs, Atom One Dark/Light theme, VS Code-matched editor
- **v2b** 🚧 — editable blocks behind `?editable=1`. Custom fields and toolbox done. Editing gestures, Python generator, and reverse sync are next.
- **v2c–v2e** — intellisense, polish, full Pybricks API — see [docs/ROADMAP.md](docs/ROADMAP.md)

## Docs

- [`docs/OVERVIEW.md`](docs/OVERVIEW.md) — scope and architecture
- [`docs/BLOCK_DESIGN.md`](docs/BLOCK_DESIGN.md) — colors, block mappings
- [`docs/FIELD_DESIGN.md`](docs/FIELD_DESIGN.md) — custom field shapes and dimensions
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — all steps, done and planned
- [`docs/GIT.md`](docs/GIT.md) — commit conventions
