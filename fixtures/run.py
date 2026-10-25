"""Runs a list of missions, one button press between each.

Call it at the end of an attachment file's main():

    await run_missions(mission1, mission2, mission3)

First mission auto-starts (menu already confirmed the choice).
Between missions: show NEXT_ICON, wait for any button.
While a mission runs: show RUNNING_ICON (static, not a spinner).
On error: show FAIL_ICON, wait for a button, end this attachment's run.
"""

from pybricks.parameters import Icon
from pybricks.tools import wait
from robot import hub


# Built-in icons are already Matrix objects, so display.icon() accepts them
# directly — no pybricks.geometry.Matrix wrapping needed.
NEXT_ICON = Icon.LEFT + Icon.RIGHT   # "press a button"
RUNNING_ICON = Icon.HAPPY            # shown while a mission runs
FAIL_ICON = Icon.SAD


async def wait_for_button():
    """Block until any button is pressed, then wait for release.

    hub.buttons.pressed() is synchronous — it returns the set of buttons
    pressed right now. To *wait*, poll with a small delay.
    The second loop debounces so the next call doesn't fire on the same press.
    """
    while not hub.buttons.pressed():
        await wait(20)
    while hub.buttons.pressed():
        await wait(20)


async def run_missions(*missions):
    """Run each mission in order."""
    for i, mission in enumerate(missions):
        # Prompt before every mission except the first.
        if i > 0:
            hub.display.icon(NEXT_ICON)
            await wait_for_button()

        # Static icon while the mission runs.
        hub.display.icon(RUNNING_ICON)

        try:
            await mission()
        except Exception as e:
            print("Mission error:", e)
            hub.display.icon(FAIL_ICON)
            await wait_for_button()
            hub.display.off()
            return

    hub.display.off()