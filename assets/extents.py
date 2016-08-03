# script for getting extents from geojson line files
# requires geojson-extent (https://github.com/mapbox/geojson-extent)

import json
import os
from subprocess import call

for fname in os.listdir('lines'):
    route, ext = fname.split('.')
    path = os.path.join('lines', fname)
    print fname
    print path
    if os.path.isfile(path) and ext == "geojson":
        with open(os.path.join('extent', route + '.json'), 'w') as fout:
            print "route: " + route
            call("geojson-extent < " + path, stdin=fout, shell=True)
