mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

var Debugger = (function() {

    var debugLayers = [];

    var bindFunctions = function() {
        $('#clearButton').click(SEPTAMap.clearAllRoutes);
        $('#formDebugger').submit(debugSubmit);
        $('#formNewDebugger').submit(debugNewSubmit);

        // change cursor over lines
        SEPTAMap.map.on('mousemove', function(e) {
            var lines = SEPTAMap.getFeatures(e.point, debugLayers);
            canvas.style.cursor = lines.length ? 'pointer' : '';
        });

        // click for line info
        SEPTAMap.map.on('click', function(e) {
            var lines = SEPTAMap.getFeatures(e.point, debugLayers);
            if (lines.length) {
                displayLineInfo(lines[0]);
                console.log(lines[0]);
            }
        });
   
        var displayLineInfo = function(line) {
        //Show popup with information about a line segment (for debugging purposes)
        var popup = new mapboxgl.Popup()
            .setLngLat(line.geometry.coordinates[0])
            .setHTML(
                "<h1>Segment index #" + line.layer.id + "</h1>" +
                "Coordinates: " + JSON.stringify(line.geometry.coordinates)
            )
            .addTo(SEPTAMap.map);
        };
    };


    /* ---------------------
    |   SUBMIT FUNCTIONS   |
    -----------------------*/

    var formSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;

        SEPTAMap.showMap();

    //Restyle form and move it away from the map
        $('.custom-combobox-input').addClass('input-fix');
        $('#clearButton').show();
        $('.container h1').hide();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.route-selection').draggable();
        if ($(window).width() > 768) {
            $('.about-icon:nth-child(2)').click(showAbout);
        }
        SEPTAMap.addRoute(route);
        
        $('form').submit(selectRoute);
    };

    var debugSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;

        SEPTAMap.showMap();

        //Add map UI
        $('.custom-combobox-input').addClass('input-fix');
        $('#clearButton').show();
        $('.container h1').hide();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.route-selection').draggable();
        if ($(window).width() > 768) {
            $('.about-icon:nth-child(2)').click(showAbout);
        }

        debugRoute(route);

        $('#formDebugger').submit(selectDebugRoute);
    };

    var debugNewSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        console.log("Route: " + route);
        var direction = $(this).serializeArray()[1].value;
        console.log("Direction: " + direction);

        SEPTAMap.showMap();

        //Add map UI
        $('.custom-combobox-input').addClass('input-fix');
        $('#clearButton').show();
        $('.container h1').hide();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.route-selection').draggable();

        debugNewRoute(route, direction);

        $('#formNewDebugger').submit(selectDebugNewRoute);
    };

    var showAbout = function(e) {
        e.preventDefault();
        $("#dialog").load("about.html .about-page-container",  function() {
            $(".about-page-container").removeClass("about-page-container");
            $("#dialog").dialog({
                height: $(window).height() * 0.9,
                width: $(window).width() * 0.8,
                modal: true,
                title: "About"
            });
        });
    };

    /* ------------------------
    |   DEBUGGING FUNCTIONS   |
    -------------------------*/

    /*Maps line segments comprising route geojson files in order to determine how the segments are stored*/
    var debugRoute = function(routeName) {
        //Clear all visible routes
        SEPTAMap.clearAllRoutes();

        //Instantiate a new route object
        var route = Route();
        route.init(routeName);
        console.log("debugging route: ");
        console.log(route);

        //Wait to GET line data, then initiate plotting
        getLinePromise(route.lineURL).then(function(line) {
            var lineStrings = line.features[0].geometry.geometries;
            var index = 0;
            var max = (lineStrings.length)-1;

            //Plot route lines in order
            var plotLineStrings = function() {
                if (max > index) {
                    var segment = lineStrings[index];
                    console.log("Debugging string #" + index);
                    console.log(segment);
                    SEPTAMap.map.addSource(index.toString(), {
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

                    SEPTAMap.map.addLayer(segmentLayer);
                    debugLayers.push(segmentLayer.id);
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
        getLinePromise(route.editedLineURL).then(function(line) {
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
                    SEPTAMap.map.addSource(coordIndex.toString(), {
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

                    SEPTAMap.map.addLayer(pointLayer);
                    debugLayers.push(pointLayer.id);
                    coordIndex++;
                }
                setTimeout(plotLineStrings, 50);
            };
            plotLineStrings();
        });
    };

    //promise object returns line data (for debugging)
    var getLinePromise = function(url) {
        return new Promise(function(resolve) {
            $.getJSON(url, function(data) {
                resolve(data);
            });
        });
    };

    /* -------------------
    |   REBIND BUTTONS   |
    ---------------------*/

    var selectRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        SEPTAMap.addRoute(route);
    };

    var selectDebugRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        debugRoute(route);
    };

    var selectDebugNewRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        var direction = $(this).serializeArray()[1].value;
        debugNewRoute(route);
    };

    var init = function() {
        $.when( SEPTAMap.init() ).done( bindFunctions() );
    };

    return {
        init: init
    };

})();


$(function() {
    Debugger.init();
});