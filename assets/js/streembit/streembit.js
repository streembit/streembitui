
var app = angular.module('streembit', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

        $stateProvider.state('start', {
            url: '/start',
            templateUrl: '/assets/views/startui.html'
        }).state('inituser', {
            url: '/inituser',
            templateUrl: '/assets/views/inituser.html'
        }).state('about',{
            url: '/about',
            templateUrl: '/assets/views/about.html'
        });

    }
]);

app.run(function ($state, $rootScope) {
    //debugger;
    $state.go("start");
});