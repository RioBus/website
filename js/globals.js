var map;
var markers = [];
var markerColors = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
var enableMarkerColors = false;

function addMarker (location, data) {
    var number = enableMarkerColors ? parseInt((data[1]).replace(/[^0-9]/g, '')) : 0;
    var iconUrl = "http://maps.google.com/mapfiles/ms/icons/" + markerColors[number%markerColors.length] + ".png";
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: data[1] + " (" + data[0] + ")",
        icon: new google.maps.MarkerImage(iconUrl)
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

var loadTimeout = 0;
var currentLine = '';
function Load(){
    var line = currentLine + "_" + loadTimeout;
    $.getJSON("/proxy.php?linha=",
        {
            linha: currentLine,
            rand: Math.round(Math.random()*999999)
        },
        function(data) {
            if (line != currentLine + "_" + loadTimeout) return;

            setAllMap(null);
            for (var i = 0; i < data.DATA.length; i++) {
                var latLng = new google.maps.LatLng(data.DATA[i][3],
                    data.DATA[i][4]);
                addMarker(latLng, data.DATA[i]);
            }

            loadTimeout = setTimeout(function(){ Load(); }, 1500);
        }
    );
}
$(document).on("click","#search", function(event){
    event.preventDefault();
    currentLine = $("#busLine").val();
    Load();
});

google.maps.event.addDomListener(window, 'load', initialize);