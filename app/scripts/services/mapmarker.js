'use strict';

/**
 * @ngdoc service
 * @name riobus.MapFactory
 * @description
 * # MapFactory
 * Factory in the riobus.
 */
angular.module('riobus')
  .factory('MapMarker', function () {

    var markers = {
      good: 'images/bus_green.png',
      average: 'images/bus_yellow.png',
      bad: 'images/bus_red.png'
    };

    var bounds = new google.maps.LatLngBounds();

    function formatInfowindowContent(data){
      return '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
                "<h6>"+data.order+" ("+data.line+")</h6>" +
                "Hora: " + (new Date(data.timeStamp)).toLocaleString('pt-BR') + "</br>" +
                "Velocidade: " + data.speed + " Km/h</br>" +
              "</div>";
    }

    function getIconPath(time){
      if(time>10) return markers.bad;
      else if(time>=5 && time<10) return markers.average;
      else return markers.good;
    }

    google.maps.Map.prototype.clearMarkers = function() {
      for(var i=0; i < this.markers.length; i++)
        this.markers[i].setMap(null);
      this.markers = new Array();
    };

    function clearMarkers(){
      google.maps.Map.clearMarkers();
      bounds = new google.maps.LatLngBounds();
    }

    function fitBounds(map){
      map.fitBounds(bounds);
    }

    function add(map, data) {
      var gpsTime = new Date(data.timeStamp);
      var iconPath = getIconPath((new Date() - gpsTime)/1000/60);
      var position = new google.maps.LatLng(data.latitude, data.longitude);

      var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: data.order + " (" + data.line + ")",
        icon: new google.maps.MarkerImage(iconPath)
      });

      marker.info = new google.maps.InfoWindow({ content: formatInfowindowContent(data) });
      google.maps.event.addListener(marker, 'click', function() {
        marker.info.open(map, marker);
      });
      bounds.extend(position);
    }

    // Public API here
    return {
      addMarker: add,
      clear: clearMarkers,
      fitBounds: fitBounds
    };
  });
