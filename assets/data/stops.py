# script for converting json files with stop data to geojson

import json
import os
from geojson import Point, Feature, FeatureCollection, dumps


def to_geojson(json_string, route):
    stops = json.loads(json_string)
    features = []
    for stop in stops:
        point = Point((stop["lng"], stop["lat"]))
        feature = Feature(geometry=point,
                          properties={"id": stop["stopid"],
                                      "route": route,
                                      "name": stop["stopname"]
                                      })
        features.append(feature)
    return dumps(FeatureCollection(features))


for fname in os.listdir('stops'):
    route, ext = fname.split('.')
    path = os.path.join('stops', fname)
    print fname
    print path
    if os.path.isfile(path) and ext == "json":
        with open(path) as fin:
            with open(os.path.join('stops', route + '.geojson'), 'w') as fout:
                print "route: " + route
                print fout
                fout.write(to_geojson(fin.read(), route))
