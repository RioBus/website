'use strict';

/**
 * @ngdoc function
 * @name riobus.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the riobus
 */
angular.module('riobus')
  .controller('MainCtrl', function ($scope, $rootScope, $http, MapMarker) {

    var self = this;

    var toastTime = 3000;

    $scope.search = function(){
      if(!this.busLines) return;
      var lines = this.busLines.replace(/\s/g, "");

      $http.get('http://'+$rootScope.dataServer.ip+':'+$rootScope.dataServer.port+'/search/'+$rootScope.dataServer.platformId+'/'+lines)
        .success(function(data, status) {
          console.log("Got "+data.length+' records.');
          self.setMarkers(data);
        })
        .error(function(data, status) {
          self.showErrorMessage(data, status);
        })
    };

    self.setMarkers = function(data){
      var map = $rootScope.map;
      for(var i=0; i<data.length; i++){
        //console.log(data[i].latitude);
        MapMarker.addMarker(map, data[i]);
        MapMarker.fitBounds(map);
      }
    };

    self.showErrorMessage = function(data, status){
      toast("("+status+") Não teve retorno", toastTime);
    };
  });
