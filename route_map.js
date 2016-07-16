mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {
    var map;
    $("form").submit(form_submit);

    function form_submit(e) {
        e.preventDefault();
        // get route selection from form
        selected_route = $("select").val();
        console.log(selected_route);
        show_map();
        //TODO: consolidate trolleys/buses
        map.on('load', function() {
            // nav controls
            map.addControl(new mapboxgl.Navigation({position: 'top-left'}));
            add_route(selected_route);
            // show vehicle data on click
            //map.on('click', show_data(e));    
        });       
        // re-style form and move it away from the map
        $('.container').addClass('postSubmit');
    };

    function add_route(route) {
        //add buses from a route to the map
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
                    map.addLayer({
                        "id": bus.label,
                        "type": "circle",
                        "source": bus.label,
                        "paint": {
                            "circle-color": "#3C48A0",
                            "circle-radius": 5
                        }
                    });
                } else {
                    map.addLayer({
                        "id": bus.label,
                        "type": "circle",
                        "source": bus.label,
                        "paint": {
                            "circle-color": "#EBA255",
                            "circle-radius": 5
                        }
                    });
                }
            });
        });
    };

    function show_map() {
    // map initialization
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v9',
            center: [-75.156133, 39.944918], //philly!
            zoom: 10.5
        });
    };

    // currently commented out in code - needs work
    function show_data(e) {
        e.preventDefault();
        var mouse_coordinates = [e.lngLat.lng, e.lngLat.lat];
        var bus_data = map.queryRenderedFeatures(e.point, {
            layers: "bus"
        });
        console.log(JSON.stringify(bus_data));
        var popup = new mapboxgl.Popup()
                .setLngLat(mouse_coordinates)
                .setHTML('<h3>' + censusObj['NAMELSAD10'] + '</h3>'
                        + '<p>' + censusObj['PERCENT_WHITE'] + '</p>')
                .addTo(map);
    }
});
