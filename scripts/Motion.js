// PLAN FOR MAP-IN-MOTION MODULE
//
// Architecture sketch for functions that might
// make up a Map in Motion module. 
//
// NOTE: the following functions assume the existence
// of a "bus" object that contains the properties:
//     - route (object)
//          x. name (string)
//          x. line (geojson object)
//     - coordinates (array)
//     - direction (string)

var Motion = (function() {

	var avgSpeed = function(bus) {
		// takes bus object;
		// returns average speed of a vehicle on a
		// given leg of a route by adding it to the 
		// bus object

		var speed = (distance / time);

		bus.speed = speed;

		return bus;
	};

	var animate = function(bus) {
		// use turf.js to update bus to a new position based on its average speed
		// and the time since the last update

		// update source to reflect new position
		map.getSource('bus').setData(bus);

		requestAnimationFrame(animate);
	}
	

	// /////////////////////////////// //
	// OLD FUNCTIONAL PROGRAMMING PLAN //
	// /////////////////////////////// //

	var getSchedule = function(bus) {
		// returns scraped schedule data from SEPTA for
		// a given bus as a csv array using Beautiful Soup
		// (www.crummy.com/software/BeautifulSoup/)
		//
		// NOTE: perhaps Beautiful Soup work should be kept in
		// the existing Python bottle, or otherwise used to store
		// and serve our own local data
		//
		// URL template: septa.org/schedules/{bus,trolley}/{w,s,h}/{###}_{0,1}.htm
		//                                   ^ (type)      ^(day)  ^(route)^(direction)

		var routeName = bus.route.name;
		var routeLine = bus.route.line;
		var direction = bus.direction;
		var timetable = [];

		var schedule = {
			routeID: routeID,
			routeLine: routeLine,
			direction: direction,
			timetable: timetable
		};

		return schedule;
	};

	var closestStops = function(schedule) {
		// compares vehicle geolocation to the stop ids in the schedule
		// using turf.js distance calculator (www.turfjs.org/), returning
		// the two closest stops and their associated timetables as an array

		var routeID = schedule.routeID;
		var routeLine = schedule.routeLine;
		var direction = schedule.direction;

		var fromId; // first stop ID
		var toId; // second stop ID
		var fromStop = []; // first stop timetable
		var toStop = []; // second stop timetable

		var stops = {
			routeID: routeID,
			fromId: fromID,
			toId: toId,
			from: from_stop,
			to: to_stop
		};

		return stops;
	};

	var Distance = function(stops) {
		// takes the stops object and returns the distance between 
		// the two stops using turf.js distance calculator 
		// (two points [stops] along a line [route])

		var stop1 = stops.fromId;
		var stop2 = stops.toId;
		var routeLine = stops.routeLine;

		// TODO: get the coordinates of those stops with turf.js

		var distance = (stop2 - stop1); // NOT ACCURATE MATH, just my general idea

		return distance;
	};

	var closestTime = function(stops) {
		// takes the timestamp of the request and compares it to the 
		// vehicle timetable, returning the row that most closely matches
		// the current time

		var timestamp;
		var timetable = stops.fromStop;
		var times = [];

		return times;
	};

	var Time = function(times) {
		// subtracts the two "closest times", returning the time
		// it takes for the bus to travel that leg of the trip.

		var time = (time1 - time2);

		return time;

	};

});