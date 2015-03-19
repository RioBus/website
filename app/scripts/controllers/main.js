'use strict';

/**
 * @ngdoc function
 * @name riobus.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the riobus
 */
angular.module('riobus')
  .controller('MainCtrl', function ($scope, $rootScope, $http, $interval, MapMarker, $routeParams) {

    $('.modal-trigger').leanModal();

    var self = this;

    var toastTime = 3000;

    $rootScope.searchLoop = null;

    $scope.search = function() {
      var lines = this.busLines || $routeParams.line;
      if (!lines) return;
      lines = lines.replace(/\s/g, "");

      if ($rootScope.searchLoop) {
        $interval.cancel($rootScope.searchLoop);
        $rootScope.searchLoop = undefined;
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
          toast('Ocorreu um erro interno. Tente novamente.', toastTime);
        });
    };


    self.setMarkers = function(data){
      var map = $rootScope.map;
      for(var i=0; i<data.length; i++){
        MapMarker.addMarker(map, data[i]);
        MapMarker.fitBounds(map);
      }
    };

    if($routeParams.line){
      $scope.search();
    }
  });
