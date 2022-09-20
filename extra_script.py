import os
from typing import Any, TYPE_CHECKING
from xml.etree.ElementTree import VERSION

if TYPE_CHECKING:
    Import: Any = None
    env: Any = {}
Import("env")

# access to global construction environment
#print env
version = "v3.7.0"
#if git tag is available use for version else use static version number
envVersionOverride = os.getenv("VERSION", version)
build_tag = env['PIOENV']
env.Append(BUILD_FLAGS='-DVERSION=\"%s\"' % envVersionOverride)
env.Replace(PROGNAME="firmware_%s"%envVersionOverride)

# Dump construction environments (for debug purpose)
#print env.Dump()
