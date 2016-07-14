mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [-75.156133, 39.944918], //philly!
        zoom: 10.5
    });

    $("form").submit(form_submit);

    function form_submit(e) {
        e.preventDefault();
        // get route selection from form
        selected_routes = $(this).serializeArray();
        console.log(selected_routes);
        $("#map").show()
        map.resize();

        $.each(selected_routes, function(i,val) {
            add_route(val.value)
            //add trolleys and buses to map
        });
        // re-style form and move it away from the map

        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.route-selection').draggable();
    }

    function add_route(route) {
        //add buses from a route to the map
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

        $.getJSON("http://www3.septa.org/api/TransitView/index.php?route=" + route +"&callback=?", function(data) {
            $.each(data.bus, function(i,bus) {
                var sourceObj =  new mapboxgl.GeoJSONSource({
                    data: {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [bus.lng, bus.lat]
                            },
                            "properties": {
                                "icon": "bus"
                            }
                        }]
                    }
                });
                console.log(bus);
                map.addSource(bus.label, sourceObj);
                if ((bus.Direction == 'NorthBound') || (bus.Direction == 'EastBound')) {
                    console.log("Condition met!");
                    map.addLayer({
                        "id": bus.label,
                        "type": "symbol",
                        "source": bus.label,
                        "layout": {
                            "icon-image": "{icon}-15",
                        },
                        "paint": {
                            "icon-color": "#FF3F60"
                        }
                    });
                } else {
                    map.addLayer({
                        "id": bus.label,
                        "type": "symbol",
                        "source": bus.label,
                        "layout": {
                            "icon-image": "{icon}-15",
                        }
                    });
                }
            });
        });
    }

    function show_map() {
    // map initialization
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [-75.156133, 39.944918], //philly!
            zoom: 10.5
        });
    }


});
