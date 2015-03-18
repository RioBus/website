'use strict';

/**
 * @ngdoc function
 * @name riobus.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the riobus
 */
angular.module('riobus')
  .controller('MainCtrl', function ($scope, $rootScope, $http) {

    var self = this;

    $scope.search = function(){
      var lines = this.busLines.replace(/\s/g, "");
      $http.get('http://'+$rootScope.dataServer.ip+':'+$rootScope.dataServer.port+'/search/'+$rootScope.dataServer.platformId+'/'+lines)
        .success(function(data) {
          self.setMarkers(data);
        })
        .error(function(data, status) {
          console.log(data);
          console.log(status);
        })
    };

    self.setMarkers = function(data){
      console.log(data);
    };
  });
