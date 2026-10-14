"""Menu: left/right picks a run, center starts it."""

# To add a run:
#   1. Make runN.py with an async function runN() (copy examplerun.py)
#   2. Add the import below
#   3. Add ("N", runN) to RUNS

from pybricks.tools import hub_menu, run_task

from robot import drive, attachment1, attachment2

from run1 import run1
# from run2 import run2
# from run3 import run3
# from run4 import run4

# (menu label, function)
RUNS = [
    ("1", run1),
    # ("2", run2),
    # ("3", run3),
    # ("4", run4),
]

labels = [label for label, _ in RUNS]

while True:
    choice = hub_menu(*labels)

    for label, run in RUNS:
        if label == choice:
            run_task(run())

    # Make sure nothing keeps running after a run ends.
    drive.stop()
    attachment1.stop()
    attachment2.stop()
