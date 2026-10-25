# Reference images

Screenshots of Pybricks Code blocks, used as the visual reference for `docs/BLOCK_DESIGN.md`.

## Naming

`<family>-<block>.png`, lowercase, hyphens. Examples:

| File                         | Shows                                                  |
| ---------------------------- | ------------------------------------------------------ |
| `setup-blocks.png`           | hub, motor, drive base setup blocks                    |
| `drive-settings-blocks.png`  | `configure` blocks from `drive.settings()`             |
| `drivebase-setup-mockup.svg` | Proposed drive base setup shape (hand-drawn, approved) |
| `drivebase-straight.png`     | `drive base straight for … then …`                     |
| `motor-run-angle.png`        | `motor run at … °/s by … ° then …`                     |
| `pid-configure.png`          | PID parameter block (v2e.1)                            |
| `hub-display.png`            | `hub.display.*` blocks                                 |
| `flow-if-else.png`           | `if … else`                                            |
| `palette-categories.png`     | The full flyout, for category colors                   |

## Screenshots vs mockups

- **`.png` files are screenshots** of real Pybricks Code output. They are evidence — a mapping backed by one is **Verified**.
- **`.svg` files are hand-drawn mockups** of a shape we have decided on but not yet built. They are design intent, not evidence. Spacing is approximate; Blockly handles real layout.

## Notation used when describing a block

When writing a block's shape in `docs/BLOCK_DESIGN.md`, use this shorthand so the description matches the image:

| Notation     | Means                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `plain text` | Static label. Not editable.                                              |
| `[name]`     | Square field.                                                            |
| `[name ▾]`   | Square field with a dropdown arrow.                                      |
| `(name)`     | Circular field.                                                          |
| `(name ▾)`   | Circular field with a dropdown arrow.                                    |
| `{icon}`     | An icon, not text.                                                       |
| `\|`         | Vertical divider separating the leading icon from the rest of the block. |

Example: `{drive base icon} \| (drive base ▾) configure [drive speed ▾] (150) mm/s`.

## Rules

- Crop to the block itself. No browser chrome, no workspace background beyond a small margin.
- PNG, 2x scale if the source is a retina screenshot. Keep each file under ~200 kB.
- One block family per file. If a block has several variants, use one file per variant.
- Reference them from `docs/BLOCK_DESIGN.md` with a relative path: `![drive base setup](images/setup-blocks.png)`.

## Why these exist

`docs/BLOCK_DESIGN.md` marks each mapping **Verified** (seen in a screenshot or generated code) or **Inference** (our guess). An image is what upgrades a row from Inference to Verified, so add one whenever a mapping is confirmed against real Pybricks Code output.
