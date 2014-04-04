var app = {
    initialize: function() {
		var mapDiv = document.getElementById('map-canvas');
		map = new google.maps.Map(mapDiv, {
			center: new google.maps.LatLng(-22.9083, -43.1964),
			zoom: 11,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		});
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function(){
    		
    },
    receivedEvent: function(id) {
    }
};