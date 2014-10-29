var map;
var markers = [];
var markersPositions = [];
var bounds = new google.maps.LatLngBounds();
var iconBase = "img/"; //'https://maps.google.com/mapfiles/kml/shapes/';
var markerColors = ['red', 'yellow', 'green'];
var loadTimeout = 0;
var currentLine = '';
var userLocation = false;
var modalOpen = false;

function addMarker(location, data) {
    markersPositions.push(location);
    var dataBR = data[0].substring(3,6) + data[0].substring(0,2) + data[0].substring(5);
    var gpsTime = new Date(Date.parse(dataBR));

    var iconUrl;
    if ((new Date() - gpsTime)/1000/60 > 10) {
        iconUrl = iconBase+"bus_" + markerColors[0] + ".png";
    } else if ((new Date() - gpsTime)/1000/60 > 5) {
        iconUrl = iconBase+"bus_" + markerColors[1] + ".png";
    } else {
        iconUrl = iconBase+"bus_" + markerColors[2] + ".png";
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

function addInfowindow(marker, line, date, velocity) {
    var contentString = '<div class="infowindow">' +
        '<div class="line"><b>Linha: </b>' + line + '</div>' +
        '<div class="date"><b>Data/Hora: </b>' + date + '</div>' +
        '<div class="velocity"><b>Velocidade: </b>' + velocity + 'Km/h</div>' +
        '</div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map,marker);
    });
}

function toast(text, timeout){
    console.log(text);
    var t = $("#toast");
    t.html(text);
    t.fadeIn();
    setTimeout(function() {
        t.fadeOut();
    }, timeout*1000);
}

function in_array(needle, group){
    var ret = false;
    for(g in group){
        if(g==needle){
            ret = true;
            break;
        }
    }
    return ret;
}

function setAllMap(map) {
    for (var i = 0; i < markers.length; i++)
        markers[i].setMap(map);
}

function clearMarkers() {
    setAllMap(null);
}

function clearMarkersPositions() {
    markersPositions = [];
}

function showMarkers() {
    setAllMap(map);
}

function deleteMarkers() {
    clearMarkers();
    markers = [];
    markersPositions = [];
}

google.maps.Map.prototype.clearMarkers = function() {
    for(var i=0; i < this.markers.length; i++)
        this.markers[i].setMap(null);
    this.markers = new Array();
};

function findBus(clicked){
    currentLine = $("#busLine").val();
	history.pushState(null, "Rio Bus - " + currentLine, "?" + currentLine);
    var line = currentLine + "_" + loadTimeout;
    $.getJSON("/proxy.php",{
            s: "1", 
            linha: currentLine,
            rand: Math.round(Math.random()*999999)
        },
        function(data, status){
			console.log (status);
            if (line != currentLine + "_" + loadTimeout) return;
            $("#spinner").hide(0);
            if(data.DATA.length==0)
                toast("Desculpe, não encontrei esta linha.", 5);
            else{
                setAllMap(null);
                clearMarkersPositions();
                for (var i = 0; i < data.DATA.length; i++) {
                    var latLng = new google.maps.LatLng(data.DATA[i][3], data.DATA[i][4]);
                    addMarker(latLng, data.DATA[i]);
                }
                if(clicked){
                    for (var i = 0, LtLgLen = markersPositions.length; i < LtLgLen; i++)
                        bounds.extend(markersPositions[i]);
                     map.fitBounds(bounds);
                }

                _gaq.push(['_trackPageview']);
                clearTimeout(loadTimeout);
                loadTimeout = setTimeout(function(){ findBus(false); }, 15000);
                console.log("A busca retornou "+data.DATA.length+" resultados.");
            }
    }).error(function(e){
        $("#spinner").hide(0);		        
		console.log(e);
		if (e.responseText.indexOf("Server Error") > -1)
			toast("O servidor da prefeitura está fora do ar neste momento. Tente novamente mais tarde.", 5);
		else
			toast("Desculpe, ocorreu algum erro. Tente novamente.", 5);
    });
}

$("#searchBox").submit(function(event){
    event.preventDefault();
    $("#spinner").show(0);
    $("#busLine").blur();
    findBus(true);
});

$('.modal').easyModal({top: 30});

$('#btn-about').click(function(e){
    e.preventDefault();
    $('.modal').trigger('openModal');
    app.openModal = true;
});