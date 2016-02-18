'use strict';

angular.module('riobus').directive('hideKeyboardOnSubmit', function() {
    return function (scope, element) {
        var textFields = element.find('input');
        
        element.bind('submit', function() {
            textFields[0].blur();
        });
    };
});