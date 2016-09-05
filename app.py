import json
import requests
from bottle import Bottle, run, debug, static_file
# DEV
import cherrypy
cherrypy.config.update({"log.screen": True})
# ENDDEV

app = Bottle()
busAPI = "http://www3.septa.org/api/TransitView/index.php?route="
root = "assets"


@app.route('/about')
def about():
    return static_file("/about.html", root)


@app.route('/')
def index():
    return static_file("/index.html", root)


@app.error(404)
def error404(error):
    return "Sorry! Nothing here!"


@app.route("/busdata/<route>")
def busdata(route):
    r = requests.get(busAPI + route)
    parsed_json = json.loads(r.content)
    features = []
    for bus in parsed_json["bus"]:
        direction = bus["Direction"]
        icon = "bus-NE"\
            if direction == "NorthBound" or direction == "EastBound"\
            else "bus-SW"

        point = {
            "type": "Point",
            "coordinates": map(float, [bus["lng"], bus["lat"]])
        }

        properties = {
            "direction": direction,
            "id": bus["label"],
            "destination": bus["destination"],
            "route": route,
            "icon": icon,
            "block": bus["BlockID"],
            "lastUpdated": bus["Offset_sec"]
        }

        feature = {
            "type": "Feature",
            "geometry": point,
            "properties": properties
        }

        features.append(feature)

    feature_collection = {"type": "FeatureCollection", "features": features}
    return json.dumps(feature_collection)


# DEV
@app.route('/<filepath:path>')
def static(filepath):
    return static_file(filepath, root)
# ENDDEV

# BUILD
# application = app
# ENDBUILD

# DEV
debug(True)
run(app, reloader=True, server="cherrypy", port=8000)
# ENDDEV
