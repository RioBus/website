'use strict';

/**
 * @ngdoc function
 * @name riobus.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the riobus
 */
angular.module('riobus')
  .controller('MainCtrl', function ($scope, $rootScope, $http, $interval, MapMarker) {

    var self = this;

    var toastTime = 3000;

    var searchLoop = null;

    $scope.search = function() {
      if (!this.busLines) return;
      var lines = this.busLines.replace(/\s/g, "");

      if (searchLoop) {
        $interval.cancel(searchLoop);
        searchLoop = undefined;
        MapMarker.clear();
      }

      self.doSearch(lines);
      searchLoop = $interval(function(){
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
            toast("Essa linha não existe ou ainda não é monitorada.", toastTime);
        })
        .error(function (data, status) {
          self.showErrorMessage(data, status);
        });
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
