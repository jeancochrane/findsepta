mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

var Tracker = (function() {
    
    var bindFunctions = function() {
        $('form').submit(formSubmit);
        $('#clearButton').click(SEPTAMap.clearAllRoutes);
    };

    var formSubmit = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;

        SEPTAMap.showMap();

    //Restyle form and move it away from the map
        $('header').hide();
        $('#clearButton').show();
        $('.form-container').addClass('route-selection').removeClass('form-container');
        $('.inner-wrapper').removeClass('inner-wrapper');
        $('.route-selection').draggable();
        
        SEPTAMap.addRoute(route);
        
        $('form').submit(selectRoute);
    };

    var selectRoute = function(e) {
        e.preventDefault();
        var route = $(this).serializeArray()[0].value;
        SEPTAMap.addRoute(route);
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
