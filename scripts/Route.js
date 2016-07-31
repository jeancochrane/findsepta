var Route = (function() {
	var name,
		busesSourceObject,
		stopsURL = 'assets/stops/';

	//Get all
	var getStopData = function() {
		var request = $.getJSON(stopsURL + name + ".json");
		request.done(function(data) {
			 var stops = [];

            $.each(data, function(i,stop) {
                stops.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [stop.lng, stop.lat]
                    },
                    "properties": {
                        "id": stop.stopid,
                        "route" : name,
                        "name": stop.stopname
                    }
                });
            });

            var geojson = {
                "type": "FeatureCollection",
                "features": stops
            };

            return geojson;
		});
	};

	var getBusData = function() {
		var request = $.getJSON("http://www3.septa.org/api/TransitView/index.php?route=" + name +"&callback=?");
		request.done(function(data) {
            var buses = [];
            //Add each bus as a feature to array of features
            $.each(data.bus, function(i,bus) {

                var dir = (bus.Direction == 'NorthBound') || (bus.Direction == 'EastBound') ? "-NE" : "-SW";

                buses.push({   
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [bus.lng, bus.lat]
                    },
                    "properties": {
                        "direction": bus.Direction,
                        "id": bus.label,
                        "destination": bus.destination,
                        "route" : name,
                        "icon": "bus" + dir,
                        "lastUpdated": bus.Offset_sec
                    }
                });
            });
            
            var geojson = {
                "type": "FeatureCollection",
                "features": buses
            };
            return geojson;
        });
	};

	var getLineData = function() {
	    var url = "assets/route-lines/" + name + ".geojson";
	    return new mapboxgl.GeoJSONSource({data: url});
	};

	var getStops = function() {
		var id = name + "-stops";
		var hoverID = id + "-hover";
		var source = new mapboxgl.GeoJSONSource({data: getStopData()});
		var layer = {
            "id": id,
            "type": "circle",
            "source": id,
            "minzoom": 13,
            "paint": {
                "circle-radius": 8,
                "circle-color": "#2b60ff",
                "circle-opacity": 0.5
            }
		};

		var hoverLayer = {
            "id": hoverID,
            "type": "circle",
            "source": hoverID,
            "minzoom": 13,
            "paint": {
                "circle-radius": 12,
                "circle-color": "#2b60ff",
                "circle-opacity": 0.4
            },
            "filter": ["==", "id", ""]
        };

		return {stops: {source: source, id: id, layer: layer}, hover: {id: hoverID, layer: hoverLayer}};

	};

	var getLine = function() {
		var id = name + "-line";
		var source = new mapboxgl.GeoJSONSource({data: getLineData()});
		var layer = {
			"id": route,
	        "type": "line",
	        "source": route,
	        "layout": {
	            "line-join": "round"
	        },
	        "paint": {
	            "line-color": "#b7b7b7",
	            "line-width": 5
	        }
		};
		return {source: source, id: id, layer: layer};
	};

	var getBuses = function() {
		var id = name + "-buses";
		var layer =	{
	        "id": id,
	        "type": "symbol",
	        "source": id,
	        "layout": {
	            "icon-image": "{icon}",
	            "icon-allow-overlap": true
	        }
	    };
	    p = new Promise(function(resolve) {
			resolve(getBusData());
		});
		p.then(function(data){
			console.log("\ngot bus data");
			console.log(data);
			busesSourceObject = new mapboxgl.GeoJSONSource({data: data});
		}).then(function(obj){
			return {source: busesSourceObject, id: id, layer: layer};
		});
	};

	var updateBuses = function() {
		var data = getBusData();
		busesSourceObject.setData(data);
	};

	var getName = function() {
		return name;
	};

	var getIDs = function() {
		return {stops: name + "-stops", buses: name + "-buses", hover: name + "-hover", line: name + "-line"};
	};

	var init = function(routeName) {
		name = routeName;
	};

	var getAll = function() {
		var stops = getStops();
		return {
			buses: getBuses(),
			stops: stops.stops,
			hover: stops.hover,
			line: getLine()
		};
	};


	return {
		updateBuses: updateBuses,
		getBuses: getBuses,
		getLine: getLine,
		getStops: getStops,
		getName: getName,
		getIDs: getIDs,
		getAll: getAll,
		init: init
	};
});