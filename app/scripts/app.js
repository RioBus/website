'use strict';
/* global angular, $, google */
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
    'ngSanitize',
    'ngTouch'
  ])
  .run(function($rootScope){

    $('.modal-trigger').leanModal();

    var dataServer = {
      platformId: 3,
      ip: '192.168.59.103',//'rest.riob.us',
      port: 8080,
      userAgent: 'riobus-web-2.0'
    };
    
    $rootScope.getEndpoint = function(){
      return 'http://' + dataServer.ip + ':' + dataServer.port; 
    };
    
    $rootScope.getPlatformId = function(){
      return dataServer.platformId;
    };
    
    $rootScope.getUserAgent = function() {
      return dataServer.userAgent;
    };

    $rootScope.updateInterval = 20000;

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
