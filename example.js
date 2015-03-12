(function (angular) {
    'use strict';

    angular.module('myApp', ['ngSanitize', 'ngWidgets'])
        .run(function ($rootScope) {


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
                emphasis: '01',
                caput: ['nomen', 'cognomen', 'nativitate'],
                natus: [{
                    arca: ['nomen01', 'cognomen01', 'nativitate01']
                }]
            };
            $rootScope.arbor2 = {
                caput: ['nomen', 'cognomen', 'nativitate'],
                natus: [{
                    arca: ['nomen01', 'cognomen01', 'nativitate01'],
                    natus: [{
                        arca: ['nomen12', 'cognomen12', 'nativitate12']
                    }, {
                        arca: ['nomen13', 'cognomen13', 'nativitate13'],
                        natus: []
                    }]
                }]
            };
            $rootScope.arbor3 = {
                caput: ['nomen', 'cognomen', 'nativitate'],
                natus: [{
                    arca: ['nomen01', 'cognomen01', 'nativitate01'],
                    natus: [{
                        arca: ['nomen12', 'cognomen12', 'nativitate12'],
                        natus: [{
                            arca: ['nomen23', 'cognomen23', 'nativitate23']
                        }, {
                            arca: ['nomen24', 'cognomen24', 'nativitate24'],
                            natus: []
                        }]
                    }, {
                        arca: ['nomen15', 'cognomen15', 'nativitate15'],
                        natus: [{
                            arca: ['nomen26', 'cognomen26', 'nativitate26']
                        }, {
                            arca: ['nomen27', 'cognomen27', 'nativitate27'],
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