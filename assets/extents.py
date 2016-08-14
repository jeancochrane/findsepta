# script for getting extents from geojson line files
# requires geojson-extent (https://github.com/mapbox/geojson-extent)

import json
import os
from subprocess import check_output

for fname in os.listdir('lines'):
    route, ext = fname.split('.')
    path = os.path.join('lines', fname)
    print fname
    print path
    if os.path.isfile(path) and ext == "geojson":
        with open(os.path.join('extents', route + '.json'), 'w') as fout:
            print "route: " + route
            fout.write(check_output("geojson-extent < " + path, shell=True))
