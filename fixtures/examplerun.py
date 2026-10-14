"""Template for a run. Copy it to runN.py and fill in the placeholders."""

from pybricks.tools import multitask
from robot import drive, attachment1 as attachment_a, attachment2 as attachment_b
from robot import home, reset_drive, normal, fast, precise

# Rename attachment_a / attachment_b above to what each one does (per run).
# Delete the one you do not use in this run.

# Named angles: tune these numbers, not the code below.
ATTACHMENT_A_HOME = 0       # placeholder
ATTACHMENT_A_ACTIVE = 140   # placeholder


# "async def" lets this function use "await". main.py starts it with run_task().
async def run1():
    # 1. Setup (robot sitting still in the launch area, attachment on)
    reset_drive()
    await home(attachment_a, -200)   # sign = direction of the hard stop
    fast()

    # 2. Mission(s): one thing at a time. Every movement gets an "await".
    await drive.straight(500)        # placeholder distance (mm)
    precise()
    await drive.turn(45)             # placeholder angle (deg)
    await attachment_a.run_target(400, ATTACHMENT_A_ACTIVE)

    # 3. Return: two things at once. multitask() starts both and
    #    continues when BOTH are finished.
    fast()
    await multitask(
        attachment_a.run_target(400, ATTACHMENT_A_HOME),
        drive.straight(-500),
    )
