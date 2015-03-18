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
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(function($rootScope){

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
