var map;
var markers = [];

function addMarker(location) {
	var marker = new google.maps.Marker({
		position: location,
		map: map
	});
	markers.push(marker);
}

function setAllMap(map) {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(map);
	}
}

function clearMarkers() {
	setAllMap(null);
}

function showMarkers() {
	setAllMap(map);
}

function deleteMarkers() {
	clearMarkers();
	markers = [];
}
function initialize() {
	var mapDiv = document.getElementById('map-canvas');
	map = new google.maps.Map(mapDiv, {
	center: new google.maps.LatLng(-22.9083, -43.1964),
	zoom: 13,
	mapTypeControl: true,
	zoomControl: true,
	mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	trafficLayer = new google.maps.TrafficLayer();
	trafficLayer.setMap(map);
}

google.maps.Map.prototype.clearMarkers = function() {
    for(var i=0; i < this.markers.length; i++){
	this.markers[i].setMap(null);
    }
    this.markers = new Array();
};

$(document).on("click","#search", function(event){
	event.preventDefault();  
	var q = $("#busLine").val();

	$.getJSON("/proxy.php?linha="+q, function(data){
		setAllMap(null);
		for (var i = 0; i < data.DATA.length; i++) {
			var latLng = new google.maps.LatLng(data.DATA[i][3],
			data.DATA[i][4]);
			addMarker(latLng);
		}
	});
});
google.maps.event.addDomListener(window, 'load', initialize);