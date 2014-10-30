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
			$("#busLine").val(url[1]);
			findBus(true);
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
    }
};

google.maps.event.addDomListener(window, 'load', app.initialize);

