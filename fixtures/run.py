"""Runs a list of missions, one button press between each.

Call it at the end of an attachment file's main():

    await run_missions(mission1, mission2, mission3)

Adding a mission = write an async def and add one argument above.
Icons live in ICONS below — edit them here, not in the attachment files.
"""

from pybricks.parameters import Color, Image
from robot import hub

# Icon shown before each mission, in order. Cycles if there are more missions than icons.
# Change these freely; they are the only display logic in the project.
ICONS = [
    Image.ARROW_RIGHT,
    Image.ARROW_LEFT,
    Image.ARROW_UP,
    Image.ARROW_DOWN,
]


async def run_missions(*missions):
    """For each mission: show an icon, wait for any button, run it.

    Any button advances — no LEFT/RIGHT branching.
    If a mission raises, show a sad face, wait for a button, and end this
    attachment's run so the menu comes back up.
    """
    for i, mission in enumerate(missions):
        hub.display.image(ICONS[i % len(ICONS)])
        await hub.buttons.pressed()
        hub.display.off()

        try:
            await mission()
        except Exception:
            # As written, a bad mission stops that attachment cleanly and the
            # menu comes back — the safe choice mid-competition.
            hub.display.image(Image.SAD)
            hub.light.on(Color.RED)
            await hub.buttons.pressed()
            hub.light.off()
            raise