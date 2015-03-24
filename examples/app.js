/*jslint unparam: true, todo: true, indent: 4 */
(function () {
  'use strict';

  angular.module('app', ['ngRoute', 'ngSanitize', 'ngWidgets'])
    .config(function ($routeProvider, $locationProvider) {
      $routeProvider
          .when('/tree', {templateUrl: 'tree.html'})
          .when('/treeMap', {templateUrl: 'treeMap.html'})
          .when('/treeTable', {templateUrl: 'treeTable.html'})
          .when('/treeWalker', {templateUrl: 'treeWalker.html'})
          .otherwise('/treeTable');

      $locationProvider.hashPrefix('!');
    })

    .controller('treeController', function ($scope) {
      $scope.bratus1 = {
        natus: [{
          nomen: 'A'
        }]
      };
      $scope.bratus2 = {
        natus: [{
          nomen: 'A',
          natus: [{
            nomen: 'B',
            natus: []
          }, {
            nomen: 'C'
          }]
        }]
      };
      $scope.bratus3 = {
        natus: [{
          nomen: 'A',
          natus: [{
            nomen: 'B',
            natus: [{
              nomen: 'D'
            }, {
              nomen: 'E',
              natus: []
            }]
          }, {
            nomen: 'C',
            natus: [{
              nomen: 'F'
            }, {
              nomen: 'G',
              natus: []
            }]
          }]
        }]
      };
    })

    .controller('treeWalkerController', function ($scope) {
      $scope.lignum1 = {
        natus: [{
          nomen: 'A'
        }]
      };
      $scope.lignum2 = {
        natus: [{
          nomen: 'A',
          natus: [{
            nomen: 'B',
            natus: []
          }, {
            nomen: 'C'
          }]
        }]
      };
      $scope.lignum3 = {
        natus: [{
          nomen: 'A',
          natus: [{
            nomen: 'B',
            natus: [{
              nomen: 'D'
            }, {
              nomen: 'E',
              natus: []
            }]
          }, {
            nomen: 'C',
            natus: [{
              nomen: 'F'
            }, {
              nomen: 'G',
              natus: []
            }]
          }]
        }]
      };
    })


}());
