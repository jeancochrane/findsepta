var Route = (function() {
	
	var getStopData = function() {

	};

	var getRouteLineData = function() {

	};

	var getBusData = function() {

	};

	var updateBuses = function() {

	};


	return {
		updateBuses: updateBuses,
		getBuses: getBuses,
		getRouteLine: getRouteLine,
		getStops: getStops,

	};

})();
var Map = (function() {

	var map, canvas, intervalID;
	var defaults = {
		updateInterval: 5000,
		controlsPosition: 'bottom-left',
		zoom: 10.5
	};
	var routes = {};
	var layerIDs = {
		buses: [],
		stops: [],
		hover: [],
		lines: []
	};

	var init = function() {	    		
		map = new mapboxgl.Map({
	        container: 'map',
	        style: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
	        center: [-75.156133, 39.944918], //philly!
	        zoom: defaults.zoom
	    });
		map.on('load', setupMap);
		intervalID = setInterval(updateRoutes, updateInterval);
	};

	var showMap = function() {
		$(map.getContainer()).show();
		//Must be called when changing map display
		map.resize();
	};

    var setupMap = function() {
    	//Add zoom/rotation controls
        map.addControl(new mapboxgl.Navigation({position: defaults.controlsPosition}));
        bindMapFunctions();
        //Cache map canvas HTMLobject
        canvas = map.getCanvas();
    };

    //Bind functions to map events
    var bindMapFunctions = function() {
    	//Display information about buses and stops on click
    	map.on(click, function(e) {
    		var buses = getFeatures(e.point, layerIDs.buses);

	        if (buses.length) {
	        	displayBusInfo(buses[0]);
	        } else {
	        	var stops = getFeatures(e.point, layerIDs.stops);

	        	if (stops.length) {
	        		displayStopInfo(stops[0]);
	        	}
	        }

    	});
        
        map.on('mousemove', function(e) {
        	var buses = getFeatures(e.point, layerIDs.buses);
        	var stops = getFeatures(e.point, layerIDs.stops);

        	//Change cursor to pointer over bus or stop
        	canvas.style.cursor = (buses.length || stops.length) ? 'pointer' : '';

        	//Add hover effect for stops
        	if (stops.length) {
        		var stop = stop[0];
        		map.setFilter(stop.hoverLayer, ["==", "ID", stop.properties.ID]);
        	} else {
        		$.each(layerIDs.hover, function(layer) {
        			map.setFilter(layer, ["==", "ID", ""]);	
        		});
        	}
        });

    };

    var getFeatures = function(point,layers) {
    	return map.queryRenderedFeatures(point, {layers: layers});
    };

    var displayStopInfo = function(stop) {
        var popup = new mapboxgl.Popup()
	        .setLngLat(stop.geometry.coordinates)
	        //HTML controlling bus information popup
	        .setHTML(
	            "<h3>" + stop.properties.stopname + "</h3>" +
	            "Stop #" + stop.properties.stopid + "<br>" +
	            "Route: " + stop.properties.route
	        )
	        .addTo(map);

    };

    var displayBusInfo = function(bus) {
        var popup = new mapboxgl.Popup()
            .setLngLat(bus.geometry.coordinates)
            //HTML controlling bus information popup
            .setHTML(
                "<h1>Route #" + bus.properties.route + "</h1>" +
                "Direction: <i>" + bus.properties.direction + "</i><br>" +
                "Destination: <i>" + bus.properties.destination + "</i><br><br>" +
                "Last updated " + format_time(bus.properties.last_updated) + " seconds ago" 
            )
            .addTo(map);

    };

    function formatTime(str) {
	//stub for a time formatting function which takes a string with the number of seconds since last update
	return str;
	}

    var updateRoutes = function() {

    };

    var addRoute = function(route) {

    };

    var removeRoute = function(route) {

    };

    var clearAllRoutes = function() {

    };

    var hideStops = function() {

    };

    var setUpdateInterval = function(interval) {
    	clearInterval(intervalID);
    	intervalID = setInterval(interval, updateRoutes);
    }; 

    return {

    	clearAllRoutes: clearAllRoutes,
    	hideStops: hideStops,
    	showStops: showStops,
    	setUpdateInterval: setUpdateInterval,
    	showMap: showMap,
    	addRoute: addRoute,
    	removeRoute: removeRoute,
    	init: init
	};

})();
var Tracker = (function() {
	var map;
	
	var bindFunctions = function() {

	};

	var init = function() {
		map = Map.init();
		bindFunctions();
	};

	return {
		init: init
	};

})();


$(function() {
	Tracker.init();
});

//# sourceMappingURL=scripts.js.map