mapboxgl.accessToken = 'pk.eyJ1IjoiamVhbmNvY2hyYW5lIiwiYSI6ImNpaDJndHlsMzB4cXN2a201bXdzZWxqZ2wifQ.toP9rJQ4ap-Z2chY_a87Vw';

$(function() {

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-75.156133, 39.944918],
    zoom: 10.5
});

});
