'use strict';

/**
 * @ngdoc function
 * @name riobus.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the riobus
 */
angular.module('riobus')
  .controller('MainCtrl', function ($scope, $rootScope, $http, $interval, MapMarker, $location) {

    var self = this;

    var toastTime = 3000;

    $rootScope.searchLoop = null;

    $scope.search = function(data) {
      if(data){
        this.busLines = data;
      }
      var lines = this.busLines;
      if (!lines){
        return;
      }
      lines = lines.replace(/\s/g, '');

      if ($rootScope.searchLoop) {
        self.cancelLoop();
      }

      self.doSearch(lines);
      $rootScope.searchLoop = $interval(function(){
        self.doSearch(lines);
      }, $rootScope.updateInterval);

    };

    self.doSearch = function(lines){
      MapMarker.clear();
      $http.get('http://' + $rootScope.dataServer.ip + ':' + $rootScope.dataServer.port + '/search/' + $rootScope.dataServer.platformId + '/' + lines)
        .success(function (data, status) {
          var records = data.length;
          console.log('Got ' + records + ' records.');
          if(records>0){
            self.setMarkers(data);
            var busLine = data[0].line;
            if(lines.split(',').length===1 && busLine!=="sem linha") {
              self.getItinerary(busLine);
            }
          }
          else{
            toast('Nenhum ônibus encontrado para a linha pesquisada.', toastTime);
            self.cancelLoop();
          }
        })
        .error(function (data, status) {
          self.cancelLoop();
          toast('Ocorreu um erro interno. Tente novamente.', toastTime);
        });
    };

    self.cancelLoop = function(){
      $interval.cancel($rootScope.searchLoop);
      $rootScope.searchLoop = undefined;
    };

    self.setMarkers = function(data){
      var map = $rootScope.map;
      for(var i=0; i<data.length; i++){
        MapMarker.addMarker(map, data[i]);
        MapMarker.fitBounds(map);
      }
    };

    self.getItinerary = function(line){
      console.log('Buscando itinerário...');

      $http.get('http://' + $rootScope.dataServer.ip + ':' + $rootScope.dataServer.port + '/itinerary/' + line)
        .success(function(data){
          console.log('Pontos: '+data.length);
          var itinerary = MapMarker.prepareItinerary(data);
          var path = new google.maps.Polyline({
            path: itinerary.spotList,
            geodesic: true,
            strokeColor: itinerary.color,
            strokeOpacity: 0.4,
            strokeWeight: 5
          });
          path.setMap($rootScope.map);
          MapMarker.setItineraryData(path);
        });

    };

    var urlData = $location.absUrl().split('?')[1];
    if(urlData){
      $scope.search(urlData);
    }
  });
