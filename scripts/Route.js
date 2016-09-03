var Route = (function() {
	var name,
		busesSourceObject,
		stopsURL = 'assets/stops/',
		lineURL = 'assets/lines/',
		newLineURL = 'assets/new_lines/',
		busURL = 'busdata/',
		extentURL = 'assets/extents/';

	var getStops = function() {
		var id = name + "-stops";
		var hoverID = id + "-hover";
		var source = new mapboxgl.GeoJSONSource({data: stopsURL});

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

		return {stops: {source: source, id: id, layer: layer}, hover: {id: hoverID, layer: hoverLayer}};
	};

	var getLine = function() {
		var id = name + "-line";
		var source;
		//Manually set the new 34 line for Map in Motion debugging
		if (id === '34-line') {
			source = new mapboxgl.GeoJSONSource({data: newLineURL});
		} else {
			source = new mapboxgl.GeoJSONSource({data: lineURL});
		}
		console.log(JSON.stringify(source));
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
		busesSourceObject = new mapboxgl.GeoJSONSource({data: busURL});

		var layer =	{
	        "id": id,
	        "type": "symbol",
	        "source": id,
	        "layout": {
	            "icon-image": "{icon}",
	            "icon-allow-overlap": true
	        }
	    };
	    
		return {source: busesSourceObject, id: id, layer: layer};
	};

	//promise object returns extent array
	var getExtentPromise = function() {
		return new Promise(function(resolve) {
			$.getJSON(extentURL, function(data) {
				resolve([[data[0], data[1]], data[2], data[3]]);
			});
		});
	};

	//promise object returns line data (for debugging)
	var getLinePromise = function() {
		return new Promise(function(resolve) {
			$.getJSON(lineURL, function(data) {
				resolve(data);
			});
		});
	};

	//promise object returns line data (for debugging new line data)
	var getNewLinePromise = function() {
		return new Promise(function(resolve) {
			$.getJSON(newLineURL, function(data) {
				resolve(data);
			});
		});
	};

	var updateBuses = function() {
		busesSourceObject.setData(busURL);
	};

	var getName = function() {
		return name;
	};

	var getLayerIDs = function() {
		return {stops: name + "-stops", buses: name + "-buses", line: name + "-line", hover: name + "-stops-hover"};
	};
	
	var getSourceIDs = function() {
		return {stops: name + "-stops", buses: name + "-buses", line: name + "-line"};
	};

	var init = function(routeName) {
		name = routeName;
		lineURL += name + ".geojson";
		newLineURL += name + ".geojson";
		stopsURL += name + ".geojson";
		busURL += name;
		extentURL += name + ".json";
	};


	return {
		updateBuses: updateBuses,
		getBuses: getBuses,
		getLine: getLine,
		getLinePromise: getLinePromise,
		getNewLinePromise: getNewLinePromise,
		getStops: getStops,
		getName: getName,
		getExtentPromise: getExtentPromise,
		getLayerIDs: getLayerIDs,
		getSourceIDs: getSourceIDs,
		init: init
	};
});