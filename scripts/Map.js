var SEPTAMap = (function() {

	var map, canvas, intervalID;
	var defaults = {
		updateInterval: 5000,
		controlsPosition: 'bottom-left',
		zoom: 10.5,
        center: [-75.156133, 39.944918], //philly,
        styleurl: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
	};
	var routes = {};
    var layerIDs = {
        buses: [],
        stops: [],
        hover: [],
        line: []
    };
    var motion = false;

	var init = function() {
		map = new mapboxgl.Map({
	        container: 'map',
	        style: defaults.styleurl,
	        center: defaults.center, //philly!
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
        		var stop = stops[0];
        		map.setFilter(stop.properties.route + "-stops-hover", ["==", "id", stop.properties.id]);
        	} else if (layerIDs.hover) {
        		$.each(layerIDs.hover, function(i, layer) {
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
                "Last updated " + formatTime(bus.properties.lastUpdated) + " seconds ago" 
            )
            .addTo(map);

    };

    function formatTime(str) {
	//stub for a time formatting function which takes a string with the number of seconds since last update
	return str;
	}

    //Request new bus/trolley location data for each visible route
    var updateRoutes = function() {
        $.each(routes, function(i, route) {
            route.updateBuses();
        });
    };

    //Add a route to the map
    var addRoute = function(routeName) {
        if (routeName in routes) {
            return;
        }
        var route = Route();
        route.init(routeName);
        console.log("adding route:");
        console.log(route);

        var line = route.getLine();
        var tmp = route.getStops();
        var stops = tmp.stops;
        var hover = tmp.hover;
        var buses = route.getBuses();

        map.addSource(line.id, line.source);
        map.addLayer(line.layer);

        map.addSource(stops.id, stops.source);
        map.addLayer(stops.layer);
        map.addLayer(hover.layer);

        map.addSource(buses.id, buses.source);
        map.addLayer(buses.layer);

        layerIDs.stops.push(stops.id);
        layerIDs.hover.push(hover.id);
        layerIDs.buses.push(buses.id);
        layerIDs.line.push(line.id);
        
        routes[routeName] = route;

        zoomToFit(route);
    };

    //Fit map to route
    var zoomToFit = function(route) {
        console.log("waiting for promise");
        route.getExtentPromise().then(function(extent) {
            console.log("zooming to extent: ");
            console.log(extent);
            map.fitBounds(extent);
        });
    };

    //Remove a route from the map
    var removeRoute = function(name, route) {
        console.log(route);
        $.each(route.getSourceIDs(), function(i, id) {
            console.log(id);
            map.removeSource(id);
        });
        $.each(route.getLayerIDs(), function(i, id) {
            console.log(id);
            map.removeLayer(id);
        });
        //remove ids from id list
        console.log(name);
        delete routes[name];
    };

    //Remove all routes from the map
    var clearAllRoutes = function() {
        console.log(routes);
        $.each(routes, removeRoute);
    };

    var hideStops = function() {
        $.each(layerIDs.stops.concat(layerIDs.hover), function(i, layer) {
            map.setLayoutProperty(layer, 'visibility', 'none');
        });
    };

    var showStops = function() {
        $.each(layerIDs.stops.concat(layerIDs.hover), function(i, layer) {
            map.setLayoutProperty(layer, 'visibility', 'visible');
        });
    };

    //Change how frequently the map updates in ms. Default 5s (5000ms)
    var setUpdateInterval = function(interval) {
        clearInterval(intervalID);
        intervalID = setInterval(interval, updateRoutes);
    };

    //Recursive function to continually update buses based on their average speed
    //and the time since the last update
    var animate = function() {

        //Vendor prefixes for animation functions
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

        while (motion) {
            var sourceID = bus.id; 
            var elapsed_time = bus.properties.lastUpdated;
            var avg_speed = bus.properties.speed;

            //TODO: use turf.js to calculate next position based on avg speed

            //update source to reflect new position
            map.getSource(sourceID).setData(bus.properties.coordinates);

            requestAnimationFrame(animate);

        } if (!motion) {
            cancelAnimationFrame();
            return;
        }
    };

    //Animate buses with our best guess of where they are since last update
    var mapInMotion = function() {
        motion = true;

        //Change "Map in Motion" button to "Cancel" button
        $('#mapInMotion').html('Cancel motion')
            .addClass('cancel')
            .unbind('click', mapInMotion)
            .click(cancelMotion);

        //TODO: cancel updates from SEPTA

        //Loop through route objects    
        $.each(routes, function(routeName, routeObject) {
            var layer = routeName + '-buses';
            var bus_data = map.queryRenderedFeatures({ layers: [layer] });
            bus_data = bus_data[0];

            //Loop through buses in a given route and trigger animation
            $.each(bus_data, function(i, bus) {
                Route.avgSpeed(bus);
                //TODO: function that jumps the icon to our best guess of its
                //location before we animate it
                animate(bus);
            });
        });
    };

    //Stop bus animation and return to static data
    var cancelMotion = function() {
        motion = false;
        $('#mapInMotion').html('Map in Motion')
            .removeClass('cancel')
            .unbind('click', cancelMotion)
            .click(mapInMotion);
        //Tracker.init();
    };

    return {
        mapInMotion: mapInMotion,
        cancelMotion: cancelMotion,
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