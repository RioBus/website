'use strict';
/* global google, angular, toast */
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
      
      if(lines.split(',').length===1 && lines!=='indefinido') { self.getItinerary(lines); }
      self.doSearch(lines, false);
      $rootScope.searchLoop = $interval(function(){
        if(lines.split(',').length===1 && lines!=='indefinido') { self.getItinerary(lines); }
        self.doSearch(lines, true);
      }, $rootScope.updateInterval);

    };

    self.doSearch = function(lines, notFirst){
      MapMarker.clear();
      var config = { headers: { 'userAgent': $rootScope.getUserAgent() } };
      $http.get($rootScope.getEndpoint() + '/v3/search/' + lines, config)
        .success(function (data) {
          var records = data.length;
          console.log('Got ' + records + ' records.');
          if(records>0){
            self.setMarkers(data);
            if(!notFirst){ MapMarker.fitBounds($rootScope.map); }
          }
          else{
            toast('Nenhum ônibus encontrado para a linha pesquisada.', toastTime);
            self.cancelLoop();
          }
        })
        .error(function (data) {
          self.cancelLoop();
          console.log(data);
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
      }
    };

    self.getItinerary = function(line){
      console.log('Buscando itinerário...');

      $http.get($rootScope.getEndpoint() + '/v3/itinerary/' + line)
        .success(function(data){
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
