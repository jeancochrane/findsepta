mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

    $("form").submit(form_submit);
    $("#clear").click(clear_all);

    //Initialize map
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
        center: [-75.156133, 39.944918], //philly!
        zoom: 10.5
    });

    /* Map setup */
    map.on('load', function() {
        //Add zoom/rotation controls
        map.addControl(new mapboxgl.Navigation({position: 'bottom-left'}));

        
        map.on('click', function (e) {
            //Display bus information on click via https://www.mapbox.com/mapbox-gl-js/example/popup-on-click/
            var buses = map.queryRenderedFeatures(e.point, {
                layers: Object.keys(visible_routes).map(function(route) {
                    return route + "-buses";
                })
            });

            if (buses.length) {
                var bus = buses[0];

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

                    return;
            }

            //Display stop information on click
            else {
                var stops = map.queryRenderedFeatures(e.point, {
                    layers: Object.keys(visible_routes).map(function(route) {
                        return route + "-stops";
                    })
                });

                if (stops.length) {
                    var stop = stops[0];
                    var popup = new mapboxgl.Popup()
                        .setLngLat(stop.geometry.coordinates)
                        //HTML controlling bus information popup
                        .setHTML(
                            "<h3>" + stop.properties.stopname + "</h3>" +
                            "Stop #" + stop.properties.stopid + "<br>" +
                            "Route: " + stop.properties.route
                            )
                        .addTo(map);

                    return;                    
                }
            }
        });

        //Could potentially cause performance issues, consider caching some of this data instead of recalculating
        map.on('mousemove', function (e) {

            var routes = Object.keys(visible_routes);

            //Convert mouse to pointer when hovering over a bus or stop 
            var buses = map.queryRenderedFeatures(e.point, {
                layers: routes.map( function(route) {
                    return route + "-buses";
                })
            });
            map.getCanvas().style.cursor = (buses.length) ? 'pointer' : '';

            //Change stop style when hovering over it
            $.each(routes, function(i, route) {
                var stops = map.queryRenderedFeatures(e.point, {layers: [route + "-stops"]});
                if (stops.length) {
                    map.setFilter(route + "-stops-hover", ["==", "stopid", stops[0].properties.stopid]);
                    map.getCanvas().style.cursor = "pointer";
                } else {
                    map.setFilter(route + "-stops-hover", ["==", "stopid", ""]);
                }

            });
        });
    });

    //Maps visible routes to GeoJSON source object, ie. {34: {<GeoJSON>}, 2: {<GeoJSON>}}
    var visible_routes = {};

    //Update buses every 5 seconds
    var intervalID = setInterval(update_all, 5*1000);
   
});

function formatTime(str) {
    //stub for a time formatting function which takes a string with the number of seconds since last update
    return str;
}

function formSubmit(e) {
    e.preventDefault();

    //Display the map
    $("#map").show();
    map.resize();

    //Get selected route from form
    route = $(this).serializeArray()[0].value;
    
    //Get promise of bus data
    var p = get_bus_data(route);
    //Add route to map after bus data is returned
    p.then(function(data){
        visible_routes[route] = new mapboxgl.GeoJSONSource({data: data});
        add_route(route);
        console.log(visible_routes);
    });

    //Restyle form and move it away from the map
    $('.form-container').addClass('route-selection').removeClass('form-container');
    $('.target').hide();
    $('.route-selection').draggable();
}

function addRoute(route) {
    /* Add route line and buses to map*/
    var url = "./assets/route-lines/" + route + ".geojson";
    var buses_id = route + "-buses";
    var stops_id = route + "-stops";

    //Add route data
    map.addSource(route, {
        "type": "geojson",
        "data": url
    });

    //Add route layer
    map.addLayer({
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
    });

    //Add stop data
    var p = get_stop_data(route);
    p.then(function(stops){
        map.addSource(stops_id, new mapboxgl.GeoJSONSource({data: stops}));

        //Add stop layer
        map.addLayer({
            "id": stops_id,
            "type": "circle",
            "source": stops_id,
            "minzoom": 13,
            "paint": {
                "circle-radius": 8,
                "circle-color": "#2b60ff",
                "circle-opacity": 0.5
            }
        });

        //Add a layer to change stop display on hover
        map.addLayer({
            "id": stops_id + "-hover",
            "type": "circle",
            "source": stops_id,
            "minzoom": 13,
            "paint": {
                "circle-radius": 12,
                "circle-color": "#2b60ff",
                "circle-opacity": 0.4
            },
            "filter": ["==", "stopid", ""]
        });
    });

    //Add bus data
    map.addSource(buses_id, visible_routes[route]);

    //Add bus layer
    map.addLayer({
        "id": buses_id,
        "type": "symbol",
        "source": buses_id,
        "layout": {
            "icon-image": "{icon}",
            "icon-allow-overlap": true
        }
    });
}

function update_all() {
    /* Get and draw new locations for all buses in visible_routes. */

    if ($.isEmptyObject(visible_routes)) {
        return;
    }

    //Get promise for each bus route, and update data when they resolve 
    //In sequence, should be in parallel bc we don't care about the order
    //See http://www.html5rocks.com/en/tutorials/es6/promises/#toc-parallelism-sequencing
    var seq = Promise.resolve();

    $.each(visible_routes, function(route,source) {
        seq = seq.then(function() {
            return get_bus_data(route);
        }).then(function(data){
            source.setData(data);
        });
    });
}

function get_stop_data(route) {
    /* Get locations of stops along a route and return them as a GeoJSON FeatureCollection */
    return new Promise(function(resolve){
        $.getJSON("assets/stops/" + route + ".json", function(data) {
            var stops = [];

            $.each(data, function(i,stop) {
                stops.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [stop.lng, stop.lat]
                    },
                    "properties": {
                        "stopid": stop.stopid,
                        "route" : route,
                        "stopname": stop.stopname
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
}

function get_bus_data(route) {
    /* Get locations of buses along a route and return them as a GeoJSON FeatureCollection */

    //Return promise so we can use async data without errors
    //See http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
    return new Promise(function(resolve) {  
        //SEPTA API call using JSONP
        $.getJSON("http://www3.septa.org/api/TransitView/index.php?route=" + route +"&callback=?", function(data) {

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
                        "route" : route,
                        "icon": "bus" + dir,
                        "last_updated": bus.Offset_sec
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
}

function clear_all() {
    //Remove all buses, stops, and routes from map
    console.log("clearing:\n" + visible_routes);
    $.each(visible_routes, function(route,source) {
        var buses_id = route + "-buses";
        var stops_id = route + "-stops";
        var hover = stops_id + "-hover";
        map.removeSource(route);
        map.removeSource(buses_id);
        map.removeSource(stops_id);
        map.removeLayer(route);
        map.removeLayer(buses_id);
        map.removeLayer(stops_id);
        map.removeLayer(hover);
    });
    visible_routes = {};
}