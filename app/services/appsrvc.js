'use strict';

var streembit = streembit || {};
streembit.services = streembit.services || {};

define(['knockout', 'jquery'], function (ko, $) {
    var viewModel = {
        is_network_init: ko.observable(false)

    };
    
    return viewModel;
});



