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
