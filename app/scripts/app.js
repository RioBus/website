'use strict';

/**
 * @ngdoc overview
 * @name riobus
 * @description
 * # riobus
 *
 * Main module of the application.
 */
angular
  .module('riobus', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({ redirectTo: '/' });
  })
  .run(function($rootScope){

    $rootScope.dataServer = {
      platformId: 3,
      ip: '127.0.0.1',
      port: 8081
    };

    $rootScope.updateInterval = 15000;

    google.maps.event.addDomListener(window, 'load', function(){
      var mapDiv = document.getElementById('map-canvas');
      var location = new google.maps.LatLng(-22.9083, -43.1964);
      $rootScope.map = new google.maps.Map(mapDiv, {
        center: location,
        zoom: 12,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      var trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap($rootScope.map);
    });
  });
