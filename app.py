import json
import requests
from datetime import datetime
from bottle import Bottle, run, debug, static_file
# DEV
import cherrypy
cherrypy.config.update({"log.screen": True})
# ENDDEV

app = Bottle()
busAPI = "http://www3.septa.org/api/TransitView/index.php?route="
scheduleURL = 'assets/schedules/',
trolleys = [10, 11, 13, 15, 34, 36, 101, 102]

root = "."


def avg_speed(bus, route):
    current_time = datetime.now().time()
    day = datetime.today().weekday()
    weekdays = [0, 1, 2, 3, 4]
    if (day in weekdays):
        day = "Weekday"
    elif (day == 5):
        day = "Saturday"
    elif (day == 6):
        day = "Sunday"

    destination = bus.destination
    URL = scheduleURL + route + '/' + day + '/' + destination + '.json'
    with open(URL) as schedule_file:
        schedule_data = json.loads(schedule_file)
    schedule_data = schedule_data.stops

    # - iterate through the list of stops
    # - compare geolocation of ids to coordinates of bus (geopy)
    # - save the two closest stops
    # - distance = the distance between them along the route
    closest_stops = {
        "closest": "",
        "second-closest": ""
    }

    # - iterate through the timetable of closest stop
    # - find list index of closest time
    # - subtract times from closest and second-closest stops
    # - average speed = distance / time (mile/min)


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
        # speed = avg_speed(bus, route)
        if route == '34':
            speed = 0.00278  # miles/sec
        else:
            speed = 0

        direction = bus["Direction"]
        icon = "bus-NE"\
            if direction == "NorthBound" or direction == "EastBound"\
            else "bus-SW"

        geometry = {
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
            "speed": speed
        }

        feature = {
            "type": "Feature",
            "geometry": geometry,
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
