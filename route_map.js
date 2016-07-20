mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

    //Initialize map
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
        center: [-75.156133, 39.944918], //philly!
        zoom: 10.5
    });

    //Add zoom/rotation controls
    map.on('load', function() {
        map.addControl(new mapboxgl.Navigation({position: 'bottom-left'}));
    });

    $("form").submit(form_submit);
    $("#clear").click(clear_all);

    //Display bus information on click via https://www.mapbox.com/mapbox-gl-js/example/popup-on-click/
    map.on('click', function (e) {
        var buses = map.queryRenderedFeatures(e.point, {
            layers: Object.keys(visible_routes).map(function(route) {
                return "route-" + route + "-buses";
            })
        });

        if (!buses.length) {
            return;
        }

        var bus = buses[0];

        var popup = new mapboxgl.Popup()
            .setLngLat(bus.geometry.coordinates)
            //HTML controlling bus information popup
            .setHTML(
                "<h1>Route #" + bus.properties.route + "</h1>" +
                "Direction: <i>" + bus.properties.direction + "</i><br>" +
                "Destination: <i>" + bus.properties.destination + "</i><br><br>" +
                "Last updated " + bus.properties.last_updated + " seconds ago" 
                )
            .addTo(map);

    });

    //Convert mouse to pointer when hovering over a bus 
    map.on('mousemove', function (e) {
        var buses = map.queryRenderedFeatures(e.point, {
            layers: Object.keys(visible_routes).map( function(route) {
                return "route-" + route + "-buses";
            })
        });
    
        map.getCanvas().style.cursor = (buses.length) ? 'pointer' : '';
    });

    //Maps visible routes to GeoJSON source object, ie. {34: {<GeoJSON>}, 2: {<GeoJSON>}}
    var visible_routes = {};

    //Update buses every 5 seconds
    var intervalID = setInterval(update_all, 5*1000);
   

    function form_submit(e) {
        e.preventDefault();

        //Display the map
        $("#map").show()
        map.resize();

        //Get selected route from form
        route = $(this).serializeArray()[0].value
        
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

    function add_route(route) {
        /* Add route line and buses to map*/
        var url = "./assets/routes/" + route + ".geojson";
        var id = "route-" + route;

        //Add route data
        map.addSource(id, {
            "type": "geojson",
            "data": url
        });

        //Add route layer
        map.addLayer({
            "id": id,
            "type": "line",
            "source": id,
            "layout": {
                "line-join": "round"
            },
            "paint": {
                "line-color": "#888",
                "line-width": 5
            }
        });
        
        id += "-buses"
        //Add bus data
        map.addSource(id, visible_routes[route]);

        //Add bus layer
        map.addLayer({
                "id": id,
                "type": "symbol",
                "source": id,
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
                return get_bus_data(route)    
            }).then(function(data){
                source.setData(data);
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

                var features = [];
                //Add each bus as a feature to array of features
                $.each(data.bus, function(i,bus) {

                    var dir = (bus.Direction == 'NorthBound') || (bus.Direction == 'EastBound') ? "-NE" : "-SW";

                    features.push({   
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

                var data = {
                    "type": "FeatureCollection",
                    "features": features
                }

                resolve(data);
            });
        });      
    }

    function clear_all() {
        //Remove all buses and routes from map
        console.log("clearing:\n" + visible_routes);
        $.each(visible_routes, function(route,source) {
            var id = "route-" + route;
            map.removeSource(id);
            map.removeSource(id + "-buses");
            map.removeLayer(id);
            map.removeLayer(id + "-buses");
        });
        visible_routes = {};
    }
});