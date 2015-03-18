'use strict';

describe('Controller: AboutCtrl', function () {

  // load the controller's module
  beforeEach(module('riobusApp'));

  var AboutCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AboutCtrl = $controller('AboutCtrl', {
      $scope: scope
    });
  }));

  it('should know what true means', function () {
    expect(true).toBe(true);
  });
});
