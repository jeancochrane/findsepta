var SEPTAMap = (function() {

	var map, canvas, intervalID;
	var defaults = {
		updateInterval: 5000,
		controlsPosition: 'bottom-left',
		zoom: 10.5
	};
	var routes = {};
    var layerIDs = {
        bus: [],
        stop: [],
        hover: [],
        line: []
    };

	var init = function() {	    		
		map = new mapboxgl.Map({
	        container: 'map',
	        style: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
	        center: [-75.156133, 39.944918], //philly!
	        zoom: defaults.zoom
	    });
		map.on('load', setupMap);
		intervalID = setInterval(updateRoutes, defaults.updateInterval);
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
    	map.on('click', function(e) {
    		var buses = getFeatures(e.point, layerIDs.bus);

	        if (buses.length) {
	        	displayBusInfo(buses[0]);
	        } else {
	        	var stops = getFeatures(e.point, layerIDs.stop);

	        	if (stops.length) {
	        		displayStopInfo(stops[0]);
	        	}
	        }

    	});
        
        map.on('mousemove', function(e) {
        	var buses = getFeatures(e.point, layerIDs.bus);
        	var stops = getFeatures(e.point, layerIDs.stop);

        	//Change cursor to pointer over bus or stop
        	canvas.style.cursor = (buses.length || stops.length) ? 'pointer' : '';

        	//Add hover effect for stops
        	if (stops.length) {
        		var stop = stop[0];
        		map.setFilter(stop.hoverLayer, ["==", "id", stop.properties.id]);
        	} else {
        		$.each(layerIDs.hover, function(layer) {
        			map.setFilter(layer, ["==", "id", ""]);	
        		});
        	}
        });

    };

    //Get features at a given point and layer
    var getFeatures = function(point,layers) {
    	return map.queryRenderedFeatures(point, {layers: layers});
    };

    //Show popup with information about the chosen stop. Takes a GeoJSON Feature
    var displayStopInfo = function(stop) {
        var popup = new mapboxgl.Popup()
	        .setLngLat(stop.geometry.coordinates)
	        //HTML controlling bus information popup
	        .setHTML(
	            "<h3>" + stop.properties.name + "</h3>" +
	            "Stop #" + stop.properties.id + "<br>" +
	            "Route: " + stop.properties.route
	        )
	        .addTo(map);

    };

    //Show popup with information about the chosen bus. Takes a GeoJSON Feature
    var displayBusInfo = function(bus) {
        var popup = new mapboxgl.Popup()
            .setLngLat(bus.geometry.coordinates)
            //HTML controlling bus information popup
            .setHTML(
                "<h1>Route #" + bus.properties.route + "</h1>" +
                "Direction: <i>" + bus.properties.direction + "</i><br>" +
                "Destination: <i>" + bus.properties.destination + "</i><br><br>" +
                "Last updated " + format_time(bus.properties.lastUpdated) + " seconds ago" 
            )
            .addTo(map);

    };

    function formatTime(str) {
	//stub for a time formatting function which takes a string with the number of seconds since last update
	return str;
	}

    //Request new bus/trolley location data for each visible route
    var updateRoutes = function() {
        $.each(Object.values(routes), function(route) {
            route.updateBuses();
        });

    };

    //Add a route to the map
    var addRoute = function(routeName) {
        var route = Route();
        route.init(routeName);
        var ids = route.getIDs();
        console.log("route, ids");
        console.log(route);
        console.log(ids);

        //Add each source/layer associated with the route and cache the layer ids
        var seq = Promise.resolve();
        $.each(route.getAll(), function(key, data) {
            seq.then(function() 
                {console.log(data);
                if (data.source) {
                    map.addSource(data.id, data.source);
                }
                map.addLayer(data.id, data.layer);
                layerIDs[key] = ids[key];
            });
        });
        seq.then(function() {
            routes[routeName] = route;

            //Zoom to fit all buses
            //Consider changing to use geojson-extent to get bounds of route line: http://stackoverflow.com/a/35692917
            var bounds = new mapboxgl.LngLatBounds();
            $.each(map.queryRenderedFeatures({layers: layerIDs.buses}), function(bus) {
                bounds.extend(bus.geometry.coordinates);
            });

            map.fitBounds(bounds);
        }); 
        
    };

    //Remove a route from the map
    var removeRoute = function(routeName) {
        $.each(Object.keys(routes[routeName].getIDs()), function(id) {
            map.removeSource(id);
            map.removeLayer(id);
        });
        //remove ids from id list
        delete routes[routeName];
    };

    //Remove all routes from the map
    var clearAllRoutes = function() {
        $.each(Object.keys(routes), removeRoute(route));
    };

    var hideStops = function() {
        $.each(layerIDs.stops.concat(layerIDs.hover), function(layer) {
            map.setLayoutProperty(layer, 'visibility', 'none');
        });
    };

    var showStops = function() {
        $.each(layerIDs.stops.concat(layerIDs.hover), function(layer) {
            map.setLayoutProperty(layer, 'visibility', 'visible');
        });
    };

    //Change how frequently the map updates in ms. Default 5s (5000ms)
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