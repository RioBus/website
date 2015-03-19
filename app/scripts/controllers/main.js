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

    var urlLines;

    var toastTime = 3000;

    $rootScope.searchLoop = null;

    $scope.search = function() {
      var lines = this.busLines || urlLines;
      if (!lines) return;
      lines = lines.replace(/\s/g, "");
      console.log(lines);

      if ($rootScope.searchLoop) {
        self.cancelLoop();
        MapMarker.clear();
      }

      self.doSearch(lines);
      $rootScope.searchLoop = $interval(function(){
        self.doSearch(lines);
      }, $rootScope.updateInterval);

    };

    self.doSearch = function(lines){
      $http.get('http://' + $rootScope.dataServer.ip + ':' + $rootScope.dataServer.port + '/search/' + $rootScope.dataServer.platformId + '/' + lines)
        .success(function (data, status) {
          var records = data.length;
          console.log("Got " + records + ' records.');
          if(records>0)
            self.setMarkers(data);
          else
            toast('Essa linha não existe ou ainda não é monitorada.', toastTime);
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

    var urlData = $location.absUrl().split('?')[1];
    if(urlData){
      urlLines = urlData;
      $scope.search();
    }
  });
