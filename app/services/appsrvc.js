'use strict';

var streembit = streembit || {};
streembit.services = streembit.services || {};

define(['knockout', 'jquery'], function (ko, $) {
    var appsrvc = {
        is_network_init: ko.observable(false)

    };
    
    return appsrvc;
});



