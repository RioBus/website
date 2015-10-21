'use strict';
/* global google */
/**
 * @ngdoc service
 * @name riobus.MapFactory
 * @description
 * # MapFactory
 * Factory in the riobus.
 */
angular.module('riobus')
  .factory('MapMarker', function (moment) {

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
      var tzOffset = ((new Date(data.timeStamp)).getTimezoneOffset()/60);
      data.sense = (data.line!=='indefinido')? data.sense.toString().replace(/ *\([^)]*\) */g, ' ') : 'Desconhecido';
      return '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
                '<h6>'+data.order+' ('+data.line+')</h6>' +
                'Atualizado em: ' + moment(data.timeStamp).add(tzOffset, 'H').format('DD/MM/YYYY HH:mm:ss a') +'<br/>' +
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
      var tzOffset = ((new Date(data.timeStamp)).getTimezoneOffset()/60);
      var gpsTime = moment(data.timeStamp).add(tzOffset, 'H');
      var iconPath = getIconPath((moment() - gpsTime)/1000/60);
      var position = new google.maps.LatLng(data.latitude, data.longitude);

      var image = {
        url: iconPath,
        scaledSize: new google.maps.Size(36, 42)
      };

      var marker = new google.maps.Marker({
        position: position,
        map: map,
        title: data.order + ' (' + data.line + ')',
        icon: image
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
      
	    it.description = data.description;
		  it.line = data.line;
  	  it.agency = data.agency;
      it.color = pathColor;

      for(var i=0; i<data.spots.length; i++){
        var spot = data.spots[i];
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
