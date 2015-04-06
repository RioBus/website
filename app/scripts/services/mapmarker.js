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

    var markerIcons = {
      good: 'images/bus_green.png',
      average: 'images/bus_yellow.png',
      bad: 'images/bus_red.png'
    };

    var pathColor = '#0000FF';

    var markers = [];

    var itineraryPath = null;

    var bounds = new google.maps.LatLngBounds();

    function formatInfowindowContent(data){
      var datetime = data.timeStamp.split(' ');
      var date = datetime[0].split('-');
      var tmp = date[0];
      date[0] = date[1];
      date[1] = tmp;
      date = date.join('/');
      var time = datetime[1];
      data.sense = data.sense.replace(/ *\([^)]*\) */g, " ");
      return '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
                '<h6>'+data.order+' ('+data.line+')</h6>' +
                'Atualizado em: ' + date + ' ' + time +'<br/>' +
                'Velocidade: ' + data.speed + ' Km/h<br/>' +
                'Sentido: ' + data.sense + '<br/>' +
              '</div>';
    }

    function getIconPath(time){
      if(time>10){
        return markerIcons.bad;
      }
      else if(time>=5 && time<10){
        return markerIcons.average;
      }
      else{
        return markerIcons.good;
      }
    }

    function clearMarkers(){
      var i;
      for(i=0; i < markers.length; i++){
        markers[i].setMap(null);
      }
      markers = [];
      if(itineraryPath){
        itineraryPath.setMap(null);
        itineraryPath = null;
      }
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
        title: data.order + ' (' + data.line + ')',
        icon: new google.maps.MarkerImage(iconPath)
      });

      marker.info = new google.maps.InfoWindow({ content: formatInfowindowContent(data) });
      google.maps.event.addListener(marker, 'click', function() {
        marker.info.open(map, marker);
      });
      bounds.extend(position);

      markers.push(marker);
    }

    function itinerary(data){
      var it = {};
      it.spotList = [];
      it.description = data[0].description;
      it.line = data[0].line;
      it.agency = data[0].agency;
      it.color = pathColor;

      for(var i=0; i<data.length; i++){
        var spot = data[i];
        var location = new google.maps.LatLng(spot.latitude, spot.longitude);
        it.spotList.push(location);
      }
      return it;
    }

    function setItineraryData(data){
      itineraryPath = data;
    }

    // Public API here
    return {
      addMarker: add,
      clear: clearMarkers,
      fitBounds: fitBounds,
      prepareItinerary: itinerary,
      setItineraryData: setItineraryData
    };
  });
