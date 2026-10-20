"""Menu: left/right picks an attachment, center starts it.

After a run, the next attachment is auto-selected.
To add an attachment:
  1. Make aN.py with an async def main() (copy exampleattach.py)
  2. Add the import below
  3. Add ("N", aN_main) to ATTACHMENTS
"""

from pybricks.parameters import Button
from pybricks.tools import run_task

from robot import hub, drive, attachment1, attachment2

from a1 import main as a1_main
# from a2 import main as a2_main
# from a3 import main as a3_main

# (menu label, function) — order matters: after a run, the next entry is preselected.
ATTACHMENTS = [
    ("1", a1_main),
    # ("2", a2_main),
    # ("3", a3_main),
]


def pick(start):
    """Menu loop. LEFT/RIGHT change selection, CENTER starts.

    Returns (index, function) so the caller can advance to the next entry.
    TODO: this replaces pybricks.tools.hub_menu, which has no "preselect"
    argument. If you would rather keep hub_menu, delete this function and
    accept that the menu always starts on entry 0.
    """
    i = start
    while True:
        hub.display.char(ATTACHMENTS[i][0])
        pressed = hub.buttons.pressed()
        if Button.LEFT in pressed:
            i = (i - 1) % len(ATTACHMENTS)
        elif Button.RIGHT in pressed:
            i = (i + 1) % len(ATTACHMENTS)
        elif Button.CENTER in pressed:
            return i, ATTACHMENTS[i][1]


next_index = 0

while True:
    index, attach_main = pick(next_index)
    hub.display.off()

    # TODO: if run_task(...).wait() is not available on your firmware,
    # use:   task = run_task(attach_main())
    #        while not task.done():
    #            wait(10)
    run_task(attach_main()).wait()

    # Make sure nothing keeps running after an attachment ends.
    drive.stop()
    attachment1.stop()
    attachment2.stop()

    # Auto-advance: next time the menu opens, it starts on the next attachment.
    next_index = (index + 1) % len(ATTACHMENTS)