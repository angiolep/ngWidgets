(function (angular) {
    'use strict';

    angular.module('myApp', ['ngWidgets'])
        .run(function ($rootScope) {

            $rootScope.message = 'Alexander the great!';

            $rootScope.phrase = $rootScope.message.split(' ');

            $rootScope.model = {
                children: [{
                    label: 'A',
                    children: [{
                        label: 'B',
                        /* empty*/
                        children: []
                    }, {
                        label: 'C'
                        /* or no children at all */
                    }]
                }]
            };


            /*$rootScope.grid1 = {
             headers: [],
             data: []
             };*/


            $rootScope.lignum1 = {
                natus: [{
                    nomen: 'A'
                }]
            };

            $rootScope.lignum2 = {
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

            $rootScope.lignum3 = {
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


            $rootScope.arbor1 = {
                caput: ['cognomen', 'nativitate'],
                natus: [{
                    nomen: 'nomen01',
                    arca: ['cognomen01', 'nativitate01']
                }]
            };
            $rootScope.arbor2 = {
                caput: ['cognomen', 'nativitate'],
                natus: [{
                    nomen: 'A01',
                    arca: ['cognomen01', 'nativitate01'],
                    natus: [{
                        nomen: 'B12',
                        arca: ['cognomen12', 'nativitate12']
                    }, {
                        nomen: 'C13',
                        arca: ['cognomen13', 'nativitate13'],
                        natus: []
                    }]
                }]
            };
            $rootScope.arbor3 = {
                caput: ['cognomen', 'nativitate'],
                natus: [{
                    nomen: 'A01',
                    arca: ['cognomen01', 'nativitate01'],
                    natus: [{
                        nomen: 'B12',
                        arca: ['cognomen12', 'nativitate12'],
                        natus: [{
                            nomen: 'D23',
                            arca: ['cognomen23', 'nativitate23']
                        }, {
                            nomen: 'E24',
                            arca: ['cognomen24', 'nativitate24'],
                            natus: []
                        }]
                    }, {
                        nomen: 'C13',
                        arca: ['cognomen15', 'nativitate15'],
                        natus: [{
                            nomen: 'F26',
                            arca: ['cognomen26', 'nativitate26']
                        }, {
                            nomen: 'G27',
                            arca: ['cognomen27', 'nativitate27'],
                            natus: []
                        }]
                    }]
                }]
            };


            $rootScope.bratus1 = {
                natus: [{
                    nomen: 'A'
                }]
            };
            $rootScope.bratus2 = {
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
            $rootScope.bratus3 = {
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
        });
}(angular));