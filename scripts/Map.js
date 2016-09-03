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
    var sources = {
        "lines": [],
        "buses": []
    };
    var layerIDs = {
        buses: [],
        stops: [],
        hover: [],
        line: [],
        debugLayers: []
    };
    var motion = false;

    //Vendor prefixes for animation functions
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

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
            var stops = getFeatures(e.point, layerIDs.stops);
            var lines = getFeatures(e.point, layerIDs.debugLayers);

	        if (buses.length) {
	        	displayBusInfo(buses[0]);
	        } else if (stops.length) {
	        	displayStopInfo(stops[0]);
            } else if (lines.length) {
                displayLineInfo(lines[0]);
                console.log(lines[0]);
            }
        });
        
        map.on('mousemove', function(e) {
        	var buses = getFeatures(e.point, layerIDs.buses);
        	var stops = getFeatures(e.point, layerIDs.stops);
            var lines = getFeatures(e.point, layerIDs.debugLayers);

        	//Change cursor to pointer over bus or stop
        	canvas.style.cursor = (buses.length || stops.length || lines.length) ? 'pointer' : '';

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

    //Show popup with information about a line segment (for debugging purposes)
    var displayLineInfo = function(line) {
        var popup = new mapboxgl.Popup()
            .setLngLat(line.geometry.coordinates[0])
            .setHTML(
                "<h1>Segment index #" + line.layer.id + "</h1>" +
                "Coordinates: " + JSON.stringify(line.geometry.coordinates)
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

        //zoomToFit(route);
    };

    //Maps line segments comprising route geojson files in order to determine
    //how the segments are stored
    var debugRoute = function(routeName) {
        //Clear all visible routes
        clearAllRoutes();

        //Instantiate a new route object
        var route = Route();
        route.init(routeName);
        console.log("debugging route: ");
        console.log(route);

        //Wait to GET line data, then initiate plotting
        route.getLinePromise().then(function(line) {
            var lineStrings = line.features[0].geometry.geometries;
            var index = 0;
            var max = (lineStrings.length)-1;

            //Plot route lines in order
            var plotLineStrings = function() {
                if (max > index) {
                    var segment = lineStrings[index];
                    console.log("Debugging string #" + index);
                    console.log(segment);
                    map.addSource(index.toString(), {
                        type: 'geojson',
                        data: {
                            "type": "FeatureCollection",
                            "features": [{
                                "type": "Feature",
                                "geometry": {
                                    "type": "LineString",
                                    "coordinates": segment.coordinates
                                }
                            }]
                        }
                    });

                    var segmentLayer = {
                        "id": index.toString(),
                        "type": "line",
                        "source": index.toString(),
                        "layout": {
                            "line-join": "round"
                        },
                        "paint": {
                            "line-color": "#b7b7b7",
                            "line-width": 5
                        }
                    };

                    map.addLayer(segmentLayer);
                    layerIDs.debugLayers.push(segmentLayer.id);
                    index++;
                }
                setTimeout(plotLineStrings, 1000);
            };
            plotLineStrings();
        });
    };

    //Alternate version of the debug function for edited route lines
    var debugNewRoute = function(routeName, routeDirection) {
        //Instantiate a new route object
        var route = Route();
        route.init(routeName);
        console.log("debugging route: ");
        console.log(route);

        //Wait to GET line data, then initiate plotting
        route.getNewLinePromise().then(function(line) {
            //Determine which set of coordinates correspond to the right direction
            var featureIndex;
            $.each(line.features, function(i, feature) {
                if (feature.properties.direction === routeDirection) {
                    featureIndex = i;
                    return;
                }
            });

            //Instantiate loop counter
            var coordIndex = 0;
            var coordSet = line.features[featureIndex].geometry.coordinates;
            var coordMax = (coordSet.length)-1;

            //Plot route lines in order
            var plotLineStrings = function() {
                if (coordMax > coordIndex) {
                    var point = coordSet[coordIndex];
                    console.log("Debugging point #" + coordIndex + " in feature #" + featureIndex);
                    console.log(point);
                    map.addSource(coordIndex.toString(), {
                        type: 'geojson',
                        data: {
                            "type": "FeatureCollection",
                            "features": [{
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": point
                                }
                            }]
                        }
                    });

                    var pointLayer = {
                        "id": coordIndex.toString(),
                        "type": "circle",
                        "source": coordIndex.toString(),
                        "paint": {
                            "circle-radius": 6,
                            "circle-color": "#2b60ff",
                            "circle-opacity": 0.4
                        }
                    };

                    map.addLayer(pointLayer);
                    layerIDs.debugLayers.push(pointLayer.id);
                    coordIndex++;
                }
                setTimeout(plotLineStrings, 50);
            };
            plotLineStrings();
        });
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
        //Remove ids from id list
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

    //Animate buses with our best guess of where they are since last update
    var mapInMotion = function() {
        motion = true;

        //Change "Map in Motion" button to "Cancel" button
        $('#mapInMotion').html('Cancel motion')
            .addClass('cancel')
            .unbind('click', mapInMotion)
            .click(cancelMotion);

        //Loop through route objects    
        $.each(routes, function(routeName, routeObject) {
            var busLayer = routeName + '-buses';
            var lineLayer = routeName + '-line';
            var busData = map.queryRenderedFeatures({ layers: [busLayer] });
            console.log('busData:');
            console.log(busData);
            var lineData = map.queryRenderedFeatures({ layers: [lineLayer] });
            console.log('lineData:');
            console.log(lineData);
            
            //Loop through buses in a given route and trigger animation
            $.each(busData, function(i, bus) {
                console.log('Animating bus #' + i + ' in route ' + routeName + '...');
                animate(bus, i, lineData);
            });
        });
    };

    //Recursive function to continually update buses based on their average speed
    //and the time since the last update
    //
    //vars 'bus' and 'line' are geojson FeatureCollections;
    //var 'index' is the index position of the individual bus in its source;
    //var 'timer' is a javascript Date object corresponding to the last time the function was called
    //
    var animate = function(bus, index, line, timer) {
        if (motion) {
            var avgSpeed = bus.properties.speed / 1000; // in miles/millisec
            var elapsedTime;
            if (timer) {
                elapsedTime = (new Date().getTime()) - timer; // millisecs since last animate
            } else {
                elapsedTime = parseInt(bus.properties.lastUpdated, 10) * 1000; // millisecs since last update
            }

            console.log("Time since last update: " + elapsedTime + " milliseconds");
            
            //Determine which line to use in FeatureCollection based on route direction
            var correctLine = findCorrectLine(bus, line);
            var routeLength = turf.lineDistance(correctLine, 'miles');

            //Find endpoints (line origin and bus)
            var origin = correctLine.geometry.coordinates[0];
            var currentLocation = bus.geometry.coordinates;

            //Determine the distance that the vehicle has already travelled as of last update
            var routeSlice = turf.lineSlice(origin, currentLocation, correctLine);
            var confirmedDistance = turf.lineDistance(routeSlice, 'miles');
            console.log("Confirmed distance the vehicle has travelled: " + confirmedDistance + " miles");
            var estimatedDistance = ((avgSpeed * elapsedTime) + confirmedDistance); //TODO: check units
            console.log("Estimated distance travelled: " + estimatedDistance + " miles");

            //If the bus has passed a route endpoint, switch its direction
            //and recalculate estimatedDistance for the new direction
            if (estimatedDistance > routeLength) {
                switch(bus.properties.direction) {
                    case ('EastBound'):
                        bus.properties.direction = 'WestBound';
                        findCorrectLine(bus, line);
                        estimatedDistance -= routeLength;
                        break;
                    case ('WestBound'):
                        bus.properties.direction = 'EastBound';
                        findCorrectLine(bus, line);
                        estimatedDistance -= routeLength;
                        break;
                    case ('NorthBound'):
                        bus.properties.direction = 'SouthBound';
                        findCorrectLine(bus, line);
                        estimatedDistance -= routeLength;
                        break;
                    case ('SouthBound'):
                        bus.properties.direction = 'NorthBound';
                        findCorrectLine(bus, line);
                        estimatedDistance -= routeLength;
                        break;
                }
            }
            //Update bus's coordinates to match estimated position
            var position = turf.along(correctLine, estimatedDistance, 'miles');
            position = position.geometry.coordinates;
            console.log("Old position:");
            console.log(bus.geometry.coordinates);
            console.log("Estimated new position:");
            console.log(position);
            bus.geometry.coordinates = position;
            console.log("Bus coordinates:");
            console.log(bus.geometry.coordinates);

            //Reset timer to allow for continual animation
            timer = new Date().getTime();

            //Update source to reflect new position
            var updatedBus = map.queryRenderedFeatures({ layers: [bus.properties.route + '-buses'] });
            updatedBus[index] = bus;
            updatedBus = {
                "type": "FeatureCollection",
                "features": updatedBus
            };
            console.log("Test new bus object:");
            console.log(JSON.stringify(updatedBus));

            map.getSource(bus.properties.route + '-buses').setData(updatedBus);
            console.log("Updated bus coordinates:");
            var testBus = map.queryRenderedFeatures({ layers: [bus.properties.route + '-buses'] });
            console.log(testBus[index].geometry.coordinates);

            //requestAnimationFrame(animate(bus, index, line, timer));

        } else if (!motion) {
            cancelAnimationFrame();
            return;
        }
    };

    //Get the correct line feature based on the direction of the vehicle
    //(for animate function)
    var findCorrectLine = function(bus, line) {
        var correctLine;
        $.each(line, function (i, feature) {
            if (feature.properties.direction === bus.properties.direction) {
                correctLine = feature;
            } else {
                console.log(feature.properties.direction + " is not equal to " + bus.properties.direction);
            }
        });
        return correctLine;
    };

    //Stop bus animation when user clicks 'cancel' button
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
        debugRoute: debugRoute,
        debugNewRoute: debugNewRoute,
    	removeRoute: removeRoute,
    	init: init
	};

})();