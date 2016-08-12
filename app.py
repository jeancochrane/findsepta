import json
import requests
from bottle import Bottle, run, debug, static_file
# DEV
import cherrypy
cherrypy.config.update({"log.screen": True})
# ENDDEV

app = Bottle()
busAPI = "http://www3.septa.org/api/TransitView/index.php?route="
scheduleAPI = "http://www.septa.org/schedules"
trolleys = [10, 11, 13, 15, 34, 36, 101, 102]

root = "."


@app.route('/')
def index():
    return static_file("/index.html", root)


@app.route('/about')
def about():
    return static_file("/about.html", root)


@app.error(404)
def error404(error):
    return "Sorry! Nothing here!"


@app.route('/busdata/<route>')
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
            "lastUpdated": bus["Offset_sec"],
            "speed": 0
        }

        feature = {
            "type": "Feature",
            "geometry": point,
            "properties": properties
        }

        features.append(feature)

    feature_collection = {"type": "FeatureCollection", "features": features}
    return json.dumps(feature_collection)


@app.route('scheduledata/<route>')
def scheduledata(route, day, direction):
    if route in trolleys:
        URL = scheduleAPI + "/trolley/"
    else:
        URL = scheduleAPI + "/bus/"

    # convert route number for API
    if ((int(route) > 0) and (int(route) < 10)):
        route = "00" + str(route)
    elif ((int(route) >= 10) and (int(route) < 100)):
        route = "0" + str(route)
    elif (int(route) >= 100):
        route = str(route)

    URL = URL + day + "/" + route + "_"


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
