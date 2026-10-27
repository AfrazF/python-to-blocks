# Pybricks block captures

Reference captures of individual blocks from Pybricks Code, used while
designing this tool's block set. See LICENSE-NOTICE.md for attribution.

Captures are grouped by Pybricks toolbox category. Subfolders mirror
Pybricks' own category names; `variables/` is kept separate because
Pybricks has Variables as its own category with its own colour.

## Inventory

| Path | Category | What it is |
|------|----------|-----------|
| `blockimg.css` | (root) | Pybricks' generated stylesheet for block rendering — reference asset, not a capture |
| `data/pybricks_blockListCreate_list_3.svg` | `data` | List create, 3 items |
| `data/pybricks_blockListUnpack.svg` | `data` | List unpack |
| `flow/pybricks_blockFlowForEach_loop_for.svg` | `flow` | `for` loop |
| `flow/pybricks_blockFlowForEach_loop_for_list.svg` | `flow` | `for … in <list>` |
| `flow/pybricks_blockFlowForEach_loop_for_range.svg` | `flow` | `for … in range(…)` |
| `flow/pybricks_blockWaitTime.svg` | `flow` | Wait for time |
| `hub/pybricks_blockButtonIsPressed_PrimeHub.svg` | `hub` | Button is pressed |
| `hub/pybricks_blockLightOnColor_primehub_off.svg` | `hub` | Light off |
| `hub/pybricks_blockLightOnColor_primehub_on.svg` | `hub` | Light on |
| `hub/pybricks_blockSpeakerBeep_PrimeHub.svg` | `hub` | Speaker beep |
| `output/drivebase/pybricks_blockDriveBaseConfigure_drivebase_straight_acceleration.svg` | `output/drivebase` | `drive.settings(straight_acceleration=…)` |
| `output/drivebase/pybricks_blockDriveBaseConfigure_drivebase_straight_speed.svg` | `output/drivebase` | `drive.settings(straight_speed=…)` |
| `output/drivebase/pybricks_blockDriveBaseConfigure_drivebase_turn_acceleration.svg` | `output/drivebase` | `drive.settings(turn_acceleration=…)` |
| `output/drivebase/pybricks_blockDriveBaseConfigure_drivebase_turn_rate.svg` | `output/drivebase` | `drive.settings(turn_rate=…)` |
| `output/drivebase/pybricks_blockDriveBaseMove_drivebase_move_straight.svg` | `output/drivebase` | Drive base move straight |
| `output/drivebase/pybricks_blockDriveBaseResetWithValues.svg` | `output/drivebase` | Drive base reset with values |
| `output/drivebase/pybricks_blockDriveBaseStop_brake.svg` | `output/drivebase` | Drive base stop (brake) |
| `output/drivebase/pybricks_blockDriveBaseUseGyro.svg` | `output/drivebase` | Drive base use gyro |
| `output/drivebase/pybricks_variables_set_drive_base.svg` | `output/drivebase` | Set drive base to X |
| `output/motor/pybricks_blockMotorResetAngle.svg` | `output/motor` | Motor reset angle |
| `output/motor/pybricks_blockMotorRun_run_angle.svg` | `output/motor` | Motor run angle |
| `output/motor/pybricks_blockMotorRun_run_target.svg` | `output/motor` | Motor run target |
| `output/motor/pybricks_blockMotorRun_run_until_stalled.svg` | `output/motor` | Motor run until stalled |
| `output/motor/pybricks_blockMotorStop_Motor_brake.svg` | `output/motor` | Motor stop (brake) |
| `output/motor/pybricks_variables_set_motor.svg` | `output/motor` | Set motor to X |
| `variables/pybricks_blockVariableGetValue.svg` | `variables` | Variable get value |
| `variables/pybricks_blockVariableSetValue.svg` | `variables` | Variable set value |

## Missing (not blocking v1.5)

- Hub display: icon, char, number, off
- Parameters: Icon.HAPPY, Color.RED, Button.LEFT, Port.A,
  Direction.CLOCKWISE, Stop.HOLD
- try / except (does not exist in Pybricks — our block will be custom)

## Notes

- Variable block placement may need refinement later. `set drive base to
  X` is currently under `output/drivebase/` because it is a hardware
  action; if that turns out to be confusing, it can be moved.
- `blockimg.css` (if present) is Pybricks' generated stylesheet for block
  rendering. Keep it alongside the SVGs as reference — it documents font,
  hover states, and text colours that are not visible in a single SVG.
