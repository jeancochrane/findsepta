mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        center: [-75.156133, 39.944918], //philly!
        zoom: 10.5
    });

    $("form").submit(form_submit);
    $("#clear").click(clear_routes);

    var visible_routes = [];

    function clear_routes() {
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

    function form_submit(e) {
        e.preventDefault();

        //display the map
        $("#map").show()
        map.resize();

        // get route selection from form
        route = $(this).serializeArray()[0].value
        visible_routes.push(route);
        console.log(visible_routes);

        //add trolleys and buses to map
        add_route(route);

        // re-style form and move it away from the map
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.route-selection').draggable();
    }

    function add_route(route) {
        /* Add route and associated buses to the map, pulling from SEPTA API
        and locally stored geojson routes. */

        //Add route line
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

        //Get route buses from SEPTA API
        $.getJSON("http://www3.septa.org/api/TransitView/index.php?route=" + route +"&callback=?", function(data) {

            var features = [];
            //Add each bus as a feature to array of features
            $.each(data.bus, function(i,bus) {
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
                        "icon": "bus"
                    }
                });
                console.log(bus);
/* Let's replace this with two different icons, eg. one called "bus-NE" and one called "bus-SW".
Then in the source we can just do:
                    var dir = (bus.Direction == 'NorthBound') || (bus.Direction == 'EastBound') ? "NE" : "SW";
                    "properties": {
                        "icon": "bus" + dir 
                    }
*/                
/*                if ((bus.Direction == 'NorthBound') || (bus.Direction == 'EastBound')) {
                    console.log("Condition met!");
                    map.addLayer({
                        "id": id + "-NE",
                        "type": "symbol",
                        "source": id,
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
*/
            });

            //Add array of buses to geojson source object
            var sourceObj =  new mapboxgl.GeoJSONSource({
                data: {
                    "type": "FeatureCollection",
                    "features": features
                }
            });
            map.addSource(id + "-buses", sourceObj);
            map.addLayer({
                "id": id + "-buses",
                "type": "symbol",
                "source": id + "-buses",
                "layout": {
                    "icon-image": "{icon}-15",
                }
            });
        });
    }
});
