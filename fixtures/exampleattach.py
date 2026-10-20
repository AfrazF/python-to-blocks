"""Template for one attachment. Copy it to aN.py and fill in the placeholders."""

from pybricks.tools import multitask
from robot import drive, attachment1 as attachment_a, attachment2 as attachment_b
from robot import home, reset_drive, normal, fast, precise
from run import run_missions

# Rename attachment_a / attachment_b above to what each one does.
# Delete the one you do not use for this attachment.

# Named angles: tune these numbers, not the code below.
HOME_A = 0                  # Attachment's resting position (after homing).
ACTIVE_A = 140              # TODO: real angle for your attachment's "engaged" position.


# Each mission is one trip out of base that ends back at base.
# These are example missions, replace everything later

async def mission1():
    """Drive out, place the first model, come back."""
    fast()                                          # Use fast speeds for the long drive.
    await drive.straight(500)                       # Drive out 500 mm from base.
    precise()                                       # Slow down for accurate placement.
    await drive.turn(45)                            # Turn 45 degrees to face the model.
    await attachment_a.run_target(400, ACTIVE_A)    # Lower the attachment onto the model.
    fast()                                          # Speed back up for the return trip.
    await drive.straight(-500)                      # Drive back to base.


async def mission2():
    """Drive out, push the second model, come back."""
    fast()                                                      # Use fast speeds.
    await drive.straight(300)                                   # Drive out 300 mm.
    precise()                                                   # Slow down for the push.
    await drive.turn(-90)                                       # Turn 90 degrees the other way.
    await multitask(                                            # Do two things at the same time:
        attachment_a.run_target(400, ACTIVE_A),                 # move the attachment down,
        drive.straight(200),                                    # and drive forward 200 mm.
    )
    await multitask(                                            # On the way back, also reset the attachment:
        attachment_a.run_target(400, HOME_A),                   # lift it back to its resting position,
        drive.straight(-500),                                   # and drive back to base.
    )


async def mission3():
    """Third mission placeholder."""
    pass    # TODO: replace with a real mission, or remove from run_missions() below.


async def main():
    """Setup once, then hand the missions to run_missions()."""
    reset_drive()                       # Zero the gyro and distance (robot still in base).
    await home(attachment_a, -200)      # Home the attachment motor against its hard stop.
    normal()                            # Set default speeds before the first mission.

    await run_missions(mission1, mission2, mission3)    # Icon → button → run, one per mission.