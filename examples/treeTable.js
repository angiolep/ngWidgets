(function () {
  'use strict';

  angular.module('app')
    .controller('treeTableController', function ($scope) {

      $scope.arbor1 = {
        id: 'arbor1',
        emphasis: '01',
        caput: ['cognomen', 'nativitate'],
        natus: [{
          nomen: 'nomen01',
          arca: ['cognomen01', 'nativitate01']
        }]
      };

      $scope.arbor2 = {
        id: 'arbor2',
        caput: ['cognomen', 'nativitate'],
        natus: [{
          nomen: 'nomen01',
          arca: ['cognomen01', 'nativitate01'],
          natus: [{
            nomen: 'nomen12',
            arca: ['cognomen12', 'nativitate12']
          }, {
            nomen: 'nomen13',
            arca: ['cognomen13', 'nativitate13'],
            natus: []
          }]
        }]
      };

      $scope.arbor3 = {
        id: 'arbor3',
        caput: ['cognomen', 'nativitate'],
        natus: [{
          nomen: 'nomen01',
          arca: ['cognomen01', 'nativitate01'],
          natus: [{
            nomen: 'nomen12',
            arca: ['cognomen12', 'nativitate12'],
            natus: [{
              nomen: 'nomen23',
              arca: ['cognomen23', 'nativitate23']
            }, {
              nomen: 'nomen24',
              arca: ['cognomen24', 'nativitate24'],
              natus: []
            }]
          }, {
            nomen: 'nomen15',
            arca: ['cognomen15', 'nativitate15'],
            natus: [{
              nomen: 'nomen26',
              arca: ['cognomen26', 'nativitate26']
            }, {
              nomen: 'nomen27',
              arca: ['cognomen27', 'nativitate27'],
              natus: []
            }]
          }]
        }]
      };

      $scope.arbor4 = {
        id: 'arbor4',
        caput: ['cognomen', 'nativitate'],
        natus: [{
          nomen: 'nomen01',
          arca: ['surname01', 'dob01'],
          bonum: {
            nomen: 'nomen01',
            arca: ['cognomen01', 'nativitate01']
          },
          malus: {
            nomen: 'name01',
            arca: ['surname01', 'dob01']
          },
          natus: [{
            bonum: {
              nomen: 'nomen12',
              arca: ['cognomen12', 'nativitate12']
            }
          }]
        }]
      };

      $scope.arbor5 = {
        id: 'arbor5',
        caput: ['cognomen', 'nativitate'],
        renderer: function (data, index) {
          var html;
          switch (index) {
          case 0:
            html = data[0];
            break;
          case 1:
            html = '<span>' + data[1][0] + '_</span><em>' + data[1][1] + '</em>';
            break;
          case 2:
            html = '<strong>' + data[2].nativitate + '</strong> years';
            break;
          }
          return html;
        },
        natus: [{
          bonum: {
            nomen: 'nomen01',
            arca: [['cognomen', '01'], {nativitate: '01'}]
          },
          natus: [{
            bonum: {
              nomen: 'nomen02',
              arca: [['cognomen', '02'], {nativitate: '02'}]
            }
          }]
        }]
      };
    });

}());
