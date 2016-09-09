
var app = angular.module('streembit', ['ui.router']);

app.config(function ($stateProvider) {
    var start_state = {
        name: 'start',
        url: '/start',
        templateUrl: '/assets/views/startui.html'
    }

    var aboutState = {
        name: 'about',
        url: '/about',
        template: '<h3>Its the UI-Router hello world app!</h3>'
    }

    $stateProvider.state(start_state);
    $stateProvider.state(aboutState);
});

app.run(function ($state, $rootScope) {
    debugger;
    $state.go("start");
});