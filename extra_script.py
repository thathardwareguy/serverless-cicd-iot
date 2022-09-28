import os
from typing import Any, TYPE_CHECKING
if TYPE_CHECKING:
    Import: Any = None
    env: Any = {}
Import("env")

version = "v4.1.4"
#if git tag is available use for version else use static version number
envVersionOverride = os.getenv("VERSION", version)
# access to global construction environment
build_tag = env['PIOENV']

env.Append(BUILD_FLAGS='-DVERSION=\"%s\"' % envVersionOverride)
env.Replace(PROGNAME="firmware_%s_%s"%(build_tag,envVersionOverride))

# Dump construction environments (for debug purpose)
#print env.Dump()
