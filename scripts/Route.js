var Route = (function() {
	var name,
		busesSourceObject,
		stopsURL = 'assets/stops/';

	//Get all
	var getStopData = function() {
		return new Promise(function(resolve) {
			$.getJSON(stopsURL + name + ".json", function(data) {
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

	            resolve(geojson);			
			});
		});
	};

	var getBusData = function() {
		return new Promise(function(resolve) {
			$.getJSON("http://www3.septa.org/api/TransitView/index.php?route=" + name +"&callback=?", function(data) {
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
	            resolve(geojson);
	        });			
		});

	};

	var getLineData = function() {
	    var url = "assets/route-lines/" + name + ".geojson";
	    return url;
	};

	var getStops = function() {
		var id = name + "-stops";
		var hoverID = id + "-hover";
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
            "source": id,
            "minzoom": 13,
            "paint": {
                "circle-radius": 12,
                "circle-color": "#2b60ff",
                "circle-opacity": 0.4
            },
            "filter": ["==", "id", ""]
        };

	    var p = getStopData();

		return p.then(function(data){
			console.log("\ngot stop data");
			console.log(data);
			var source = new mapboxgl.GeoJSONSource({data: data});
			return {stops: {source: source, id: id, layer: layer}, hover: {id: hoverID, layer: hoverLayer}};
		});  
	};

	var getLine = function() {
		var id = name + "-line";
		var source = new mapboxgl.GeoJSONSource({data: getLineData()});
		var layer = {
			"id": id,
	        "type": "line",
	        "source": id,
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
	    var p = getBusData();
		return p.then(function(data){
			console.log("\ngot bus data");
			console.log(data);
			console.log(p);
			busesSourceObject = new mapboxgl.GeoJSONSource({data: data});
			return {source: busesSourceObject, id: id, layer: layer};
		});
	};

	var updateBuses = function() {
		var p = getBusData();
		return p.then(function(data){
			busesSourceObject.setData(data);	
		});
		
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
		return {
			buses: getBuses(),
			stops: getStops(),
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