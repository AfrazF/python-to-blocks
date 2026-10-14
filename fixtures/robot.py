"""Shared hardware and helper functions."""

from pybricks.hubs import PrimeHub
from pybricks.pupdevices import Motor
from pybricks.parameters import Port, Direction, Stop
from pybricks.robotics import DriveBase

# ---------------------------------------------------------------- hardware
hub = PrimeHub() # tests

# TODO: match these to the actual connections (ports + which side needs reversing)
left = Motor(Port.A, Direction.COUNTERCLOCKWISE)
right = Motor(Port.B)
attachment1 = Motor(Port.C)
attachment2 = Motor(Port.D)

# TODO: measure the actual diameter and track (in mm). Test with drive.straight(1000) and measure with ruler.
WHEEL_DIAMETER = 56
AXLE_TRACK = 112

drive = DriveBase(left, right, WHEEL_DIAMETER, AXLE_TRACK)
drive.use_gyro(True)


# ------------------------------------------------------------ speed presets
# Only call these between moves, not while the robot is moving.
def normal():
    """Default settings."""
    drive.settings(
        straight_speed=350,
        straight_acceleration=700,
        turn_rate=150,
        turn_acceleration=400,
    )


def fast():
    """Long drives with no obstacles."""
    drive.settings(
        straight_speed=500,
        straight_acceleration=1000,
        turn_rate=200,
        turn_acceleration=500,
    )


def precise():
    """Careful approaches, turns and alignment."""
    drive.settings(
        straight_speed=150,
        straight_acceleration=300,
        turn_rate=80,
        turn_acceleration=200,
    )


# --------------------------------------------------------- reset / homing
def reset_drive():
    """Zero distance and heading (and the gyro). Call while the robot sits still."""
    drive.reset(distance=0, angle=0)


async def home(motor, speed, duty=40):
    """Push into the hard stop, then call that position 0. Use with await."""
    await motor.run_until_stalled(speed, then=Stop.COAST, duty_limit=duty)
    motor.reset_angle(0)
