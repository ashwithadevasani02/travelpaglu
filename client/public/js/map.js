var map = L.map('map').setView(coordinates, 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:22,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
console.log(coordinates);
var marker = L.marker(coordinates).addTo(map);
marker.bindPopup("<p>Exact location will be shown after booking</p>").openPopup();
function updateLocation(newcoordinates) {
  marker.setLatLng(newcoordinates);    
  map.setView(newcoordinates, 13);     
}