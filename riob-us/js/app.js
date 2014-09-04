var app = {
    openModal: false,
    initialize: function(){
        /*if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                app.geolocationSuccess,
                app.geolocationError,
                {timeout:5000}); // Tempo limite pra tentar carregar alguma coisa
        }
        else*/ 
		app.createMap();
		var url = (document.URL).split("?");
		if (url.length > 1) {
			app.findBusByLine(url[1]);
		}
    },
    geolocationSuccess: function(position){
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        userLocation = new google.maps.LatLng(lat, lon);
        app.createMap();
        app.showDevicePosition(userLocation);
    },
    geolocationError: function(error){
        console.log('[ERROR '+ error.code + '] ' + error.message);
        toast("Não foi possível recuperar sua localização.", 3);
        app.createMap();
    },
    createMap: function(){
        var mapDiv = document.getElementById('map-canvas');

        var location = (userLocation)? userLocation : new google.maps.LatLng(-22.9083, -43.1964);
        map = new google.maps.Map(mapDiv, {
            center: location,
            zoom: 12,
            disableDefaultUI: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
    },
    showDevicePosition: function(location){
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: iconBase + 'man_maps.png',
        });
    },
	findBusByLine: function(line) {
		currentLine = line;
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
};

google.maps.event.addDomListener(window, 'load', app.initialize);

