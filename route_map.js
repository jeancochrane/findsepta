mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jeancochrane/ciqe4lxnb0002cem7a4vd0dhb',
        center: [-75.156133, 39.944918], //philly!
        zoom: 10.5
    });

    $("form").submit(form_submit);
    $("#clear").click(clear_all);

    var visible_routes = [];

    //Update buses every 5 seconds
    var intervalID = setInterval(update_all, 5*1000);

    map.on('click', function (e) {
        var buses = map.queryRenderedFeatures(e.point, {
            layers: visible_routes.map(function(route) {
                return "route-" + route + "-buses";
            })
        });

        if (!buses.length) {
            return;
        }

        var bus = buses[0];

        var popup = new mapboxgl.Popup()
            .setLngLat(bus.geometry.coordinates)
            .setHTML(
                "<h1>Route #" + bus.properties.route + "</h1>" +
                "Direction: <em>" + bus.properties.direction + "</em><br>" +
                "Destination: <em>" + bus.properties.destination + "</em><br>"
                )
            .addTo(map);

    });

    map.on('mousemove', function (e) {
        var buses = map.queryRenderedFeatures(e.point, {
            layers: visible_routes.map(function(route) {
                return "route-" + route + "-buses";
            })
        });
    
        map.getCanvas().style.cursor = (buses.length) ? 'pointer' : '';

    });

    function clear_all() {
        console.log("clearing:\n" + visible_routes);
        $.each(visible_routes, function(i,v) {
            var id = "route-" + v;
            map.removeSource(id);
            map.removeSource(id + "-buses");
            map.removeLayer(id);
            map.removeLayer(id + "-buses");
        });
        visible_routes = [];
    }

    function clear_route(route) {
        /* Deletes a route from the map, does not remove it from the list of visible routes */
        var id = "route-" + route;
        map.removeSource(id);
        map.removeLayer(id);
    }

    function clear_buses(route) {
        /* Deletes buses on a route from the map, does not remove it from the list of visible routes */
        var id = "route-" + route + "-buses";
        map.removeSource(id);
        map.removeLayer(id);
    }

    function form_submit(e) {
        e.preventDefault();

        //display the map
        $("#map").show()
        map.resize();
        map.addControl(new mapboxgl.Navigation({position: 'bottom-left'}));

        route = $(this).serializeArray()[0].value
        visible_routes.push(route);
        console.log(visible_routes);
        add_route(route);
        update_buses(route);

        // re-style form and move it away from the map
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.target').hide();
        $('.route-selection').draggable();
    }

    function add_route(route) {
        /* Add route line */
        var url = "./assets/routes/" + route + ".geojson";
        var id = "route-" + route;

        map.addSource(id, {
            "type": "geojson",
            "data": url
        });

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
    }

    function update_all() {
        /* Gets and draws new locations for all buses in visible_routes. Should be optimized so it doesn't 
            delete the source and layer each time, instead using source.setData(data) as shown in the example
            at https://www.mapbox.com/mapbox-gl-js/example/live-geojson/ */

        if (visible_routes.length != 0) {
            $.each(visible_routes, function(i,route) {
                clear_buses(route);
                update_buses(route);
            });
        }
    }

    function update_buses(route) {
        /* Add route and associated buses to the map, pulling from SEPTA API
        and locally stored geojson routes. */
        var id = "route-" + route + "-buses";
        //Get route's buses from SEPTA API
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
                        "icon": "bus" + dir
                    }
                });
            });

            //Add array of buses to geojson source object
            var sourceObj =  new mapboxgl.GeoJSONSource({
                data: {
                    "type": "FeatureCollection",
                    "features": features
                }
            });

            map.addSource(id, sourceObj);
            map.addLayer({
                "id": id,
                "type": "symbol",
                "source": id,
                "layout": {
                    "icon-image": "{icon}",
                    "icon-allow-overlap": true
                }
            });
        });
    }
});
