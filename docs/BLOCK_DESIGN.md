# Block design (v1, read-only)

Reference: Pybricks Code block editor (user's screenshots and generated Python, 2026-10-12).
**Verified** = seen in the screenshots or generated code. **Inference** = our guess, check before relying on it.

## Colors (hex)

## Colors (hex)

| Category          | Fill      | Stroke    | Used for                                                                       |
| ----------------- | --------- | --------- | ------------------------------------------------------------------------------ |
| Setup hat         | `#ffbf00` | `#bf8f00` | `set up` hat only                                                              |
| Tasks             | `#9a72a2` | `#74567a` | task (`async def`) block, `await` wrapper, multitask                           |
| Output            | `#4c97ff` | `#3971bf` | motor, drive base, setup blocks, print                                         |
| Input             | `#5cb1d6` | `#4585a1` | sensors (not needed in v1)                                                     |
| Flow              | `#ffab19` | `#bf8013` | if/else, wait, repeat, for, while                                              |
| Variables / Calls | `#ff6680` | `#bf4d60` | variables, imports, plain `def` functions, call blocks                         |
| Hardware objects  | `#46BAEC` | `#358BB0` | Motor and DriveBase object chips (`drive`, `attachment_a`, `left`, `right`, …) |
| Data              | `#00cc99` | `#009973` | lists, geometry                                                                |
| Other             | `#9a72a2` | `#74567a` | (unused in v1)                                                                 |

- Workspace background `#ecf0f1`.
- No icons in v1 (user decision).
- **Deviations from Pybricks:**
  - The `set up` hat is orange (`#ffbf00`) to match SPIKE Prime's "when program starts" hat. Tasks and other async constructs are purple.
  - `async def` definitions render as purple task blocks; `await <async-call>` renders as a purple `await` wrapper around a pink call block.
  - The `hub` object chip is purple (it's top-level setup code, visually grouped with tasks).
  - Plain `def` functions are pink (like Scratch custom blocks), not yellow. Deliberately distinct from tasks.
  - Object chips use two colors: **cyan** for hardware that moves the robot (Motor, DriveBase), **purple** for the hub. Not pink, to keep pink from being overloaded.
  - `if` uses Flow orange (`#ffab19`), matching wait/repeat. No separate decisions color.

## Rules

- Each file's top-level code sits under one yellow **`set up`** hat (user decision).
- **Await:** hidden on Pybricks' own blue/orange blocks (verified: they add it when generating). For calls Pybricks cannot express (e.g. `await home(...)`), show a separate **`await`** wrapper block holding a value-shaped call block (user decision). Pybricks' pink call blocks add no await (verified).
- `async def` is a **task** block, plain `def` is a **function** block, same yellow shape (user decision). Parameters show as pink chips.
- Omitted defaults show as Pybricks does: e.g. `then hold` is shown even when `then` is not written (verified).
- Do not show `await wait(0)` (Pybricks adds it, your code does not have it).
- Keyword arguments in generic call blocks show as `name: value` labels (our default).
- `Direction.CLOCKWISE` / `COUNTERCLOCKWISE` show as words, since there are no icons (our default).
- Comments become Blockly comments on the next block (user decision). Comments with no next block: OPEN.

## Python to block

| Python                                                     | Block                                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from m import a`                                          | `from [m] import [a]`, one block per name (verified). Optional `as [alias]` field (our extension, for `attachment1 as attachment_a`)                                    |
| `X = 56`                                                   | `X starting at 56` for the first assignment, `X set to` after (inference)                                                                                               |
| `hub = PrimeHub()`                                         | `prime hub` setup block (verified)                                                                                                                                      |
| `m = Motor(Port.A, Direction.X)`                           | `m on A with [direction]` (verified)                                                                                                                                    |
| `d = DriveBase(l, r, wd, at)`                              | `drive base left [l] right [r] with [wd] mm and [at] mm` (verified)                                                                                                     |
| `await m.run_target(s, a)`                                 | `m run at [s] °/s towards [a] then hold` (verified)                                                                                                                     |
| `await m.run_until_stalled(s, then, duty)`                 | `m run at [s] °/s to end stop with power limit [duty] then [then]` (verified)                                                                                           |
| `await m.run_angle(s, a)`                                  | `m run at [s] °/s by [a] ° then hold` (verified)                                                                                                                        |
| `await m.run_time(s, t)`, `m.run(s)`                       | not seen in the editor; mode names unknown (inference)                                                                                                                  |
| `m.reset_angle(0)`                                         | `m reset angle to [0] °` (verified)                                                                                                                                     |
| `m.stop()`                                                 | `m stop [coast]` (verified)                                                                                                                                             |
| `await drive.straight(d)`                                  | `drive drive [straight] for [d] mm then hold` (verified)                                                                                                                |
| `await drive.turn(a)`                                      | same block, `turn` option (inference)                                                                                                                                   |
| `drive.settings(straight_speed=…)`                         | one `configure drive speed` block per kwarg; `straight_acceleration` = drive acceleration, `turn_rate` = turn speed, `turn_acceleration` = turn acceleration (verified) |
| `drive.reset(distance=0, angle=0)`                         | `reset distance [0] mm angle [0] °` (verified)                                                                                                                          |
| `drive.use_gyro(True)`                                     | `drive base use [gyro]` (verified)                                                                                                                                      |
| `await wait(500)`                                          | `wait [500] ms` (verified)                                                                                                                                              |
| `if / else`, `while`, `for x in range(n)`                  | Flow blocks: `if … else`, `repeat while`, `for item in range` (verified)                                                                                                |
| `async def runN():`                                        | `task [runN]` with parameter chips (verified)                                                                                                                           |
| `def f():`                                                 | `function [f]` (our block)                                                                                                                                              |
| `await multitask(a, b, race=True)`                         | `multitask until [all/any] done`, **one slot per argument**; `race=True` = `any` (verified; stacking two blocks in one slot makes them sequential)                      |
| `await f(args)` (your helper)                              | `await` wrapper around a pink value `call [f] args`                                                                                                                     |
| `f(args)` (no await)                                       | pink statement `call [f] args` (verified)                                                                                                                               |
| `obj.method(args)` (unknown)                               | pink `object call method` (statement or value form, verified)                                                                                                           |
| list comprehension, star-args, tuple unpacking, docstrings | generic blocks (assign, comprehension, comment)                                                                                                                         |
| anything else                                              | raw-code block. Must be **0** in robot.py, main.py, examplerun.py                                                                                                       |

## Not seen yet (OPEN)

- Color of a call to a task defined in the same file
- Color of the `await` wrapper block (default: Tasks yellow, our choice)
- Mode names for `run_time` and `run`, and the `turn` option
- Pybricks' **Other** flyout
