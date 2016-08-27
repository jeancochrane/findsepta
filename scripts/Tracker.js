mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';
var Tracker = (function() {
    
    var bindFunctions = function() {
        $('#formTracker').submit(formSubmit);
        $('#formDebugger').submit(debugSubmit);
        $('#formNewDebugger').submit(debugNewSubmit);
        $('#clearButton').click(SEPTAMap.clearAllRoutes);
        $('#mapInMotion').click(SEPTAMap.mapInMotion);
    };

    var formSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;

        SEPTAMap.showMap();

        //Add map UI
        $('header').hide();
        $('#clearButton').show();
        $('#mapInMotion').show().addClass('motion').html('Map in Motion');
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.inner-wrapper').removeClass('inner-wrapper');
        $('.route-selection').draggable();
        
        SEPTAMap.addRoute(route);
        
        $('#formTracker').submit(selectRoute);
    };

    var debugSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;

        SEPTAMap.showMap();

        //Add map UI
        $('header').hide();
        $('#clearButton').show();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.inner-wrapper').removeClass('inner-wrapper');
        $('.route-selection').draggable();

        SEPTAMap.debugRoute(route);

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
        $('header').hide();
        $('#clearButton').show();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.inner-wrapper').removeClass('inner-wrapper');
        $('.route-selection').draggable();

        SEPTAMap.debugNewRoute(route, direction);

        $('#formNewDebugger').submit(selectDebugNewRoute);
    };


    var selectRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        SEPTAMap.addRoute(route);
    };

    var selectDebugRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        SEPTAMap.debugRoute(route);
    };

    var selectDebugNewRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        var direction = $(this).serializeArray()[1].value;
        SEPTAMap.debugNewRoute(route);
    };

    var init = function() {
        SEPTAMap.init();
        bindFunctions();
    };

    return {
        init: init
    };

})();


$(function() {
    Tracker.init();
});
