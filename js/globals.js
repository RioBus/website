var map;
var markers = [];
var markerColors = ['red', 'yellow', 'green'];

function addMarker (location, data) {  
    var dataBR = data[0].substring(3,6) + data[0].substring(0,2) + data[0].substring(5);
    var gpsTime = new Date(Date.parse(dataBR));

	var iconUrl;
	if (Math.abs(new Date() - gpsTime)/1000/60 > 10) {
		iconUrl = "/img/bus_" + markerColors[0] + ".png";
	} else if (Math.abs(new Date() - gpsTime)/1000/60 > 5) {
		iconUrl = "/img/bus_" + markerColors[1] + ".png";
	} else {
		iconUrl = "/img/bus_" + markerColors[2] + ".png";
	}
  
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: data[1] + " (" + data[0] + ")",
        icon: new google.maps.MarkerImage(iconUrl)
    });
	marker.info = new google.maps.InfoWindow({
		content: '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
                 "Código: " + data[1] + "</br>" +
				 "Hora: " + gpsTime.toLocaleString('pt-BR') + "</br>" +
				 "Velocidade: " + data[5] + " Km/h</br>" +
                 "</div>"
	});
	google.maps.event.addListener(marker, 'click', function() {
		marker.info.open(map, marker);
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
    $.getJSON("/proxy.php",
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
    		clearTimeout(loadTimeout);
            loadTimeout = setTimeout(function(){ Load(); }, 15000);
        }
    );
}
$(document).on("click","#search", function(event){
    event.preventDefault();
    currentLine = $("#busLine").val();
    Load();
});

google.maps.event.addDomListener(window, 'load', initialize);