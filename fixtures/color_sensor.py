from pybricks.hubs import PrimeHub
from pybricks.pupdevices import ColorSensor, Motor
from pybricks.parameters import Port, Direction
from pybricks.robotics import DriveBase
from pybricks.tools import wait

hub = PrimeHub()

left_motor = Motor(Port.A, Direction.CLOCKWISE)
right_motor = Motor(Port.B, Direction.CLOCKWISE)
drive = DriveBase(left_motor, right_motor, wheel_diameter=56, axle_track=112)

line_left = ColorSensor(Port.C)
line_right = ColorSensor(Port.D)

BLACK = 10
WHITE = 80
THRESHOLD = (BLACK + WHITE) // 2


def on_line(sensor):
    return sensor.reflection() < THRESHOLD


def drive_until_line(sensor, speed=300):
    while not on_line(sensor):
        drive.drive(speed, 0)
    drive.stop()


def square_on_line(sensor):
    for _ in range(4):
        drive_until_line(sensor)
        drive.turn(90)
        wait(100)


def main():
    drive_until_line(line_left)
    square_on_line(line_right)
    print(line_left.color())
    print(line_left.hsv())
    print(line_left.ambient())


main()
