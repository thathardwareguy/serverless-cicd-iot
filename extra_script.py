from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    Import: Any = None
    env: Any = {}
Import("env")

# access to global construction environment
#print env
build_tag = env['PIOENV']
env.Replace(PROGNAME="firmware_2.5.0_%s"% build_tag)

# Dump construction environments (for debug purpose)
#print env.Dump()
