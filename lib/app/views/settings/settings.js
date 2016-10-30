/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    define(['knockout', 'appconfig', './settings.html!text'], function (ko, config, template) {

        function SettingsVm() {
            var viewModel = {
                iswsfallback: ko.observable(false),
                bootseeds: ko.observableArray([]),
                iceresolvers: ko.observableArray([]),
                tcpport: ko.observable(0),
                wsport: ko.observable(0),
                selected_transport: ko.observable(),
                is_add_bootseed: ko.observable(false),
                new_seed_host: ko.observable(""),
                new_seed_port: ko.observable(""),
                new_seed_publickey: ko.observable(""),
                new_iceresolver: ko.observable(""),
                is_add_iceresolver: ko.observable(false),
                private_net_account: ko.observable(""),
                private_net_port: ko.observable(""),
                private_net_address: ko.observable(""),
                isdevmode: ko.observable(),
                selected_loglevel: ko.observable(),

                init: function (callback) {
                    try {
                        this.iswsfallback(config.appconfig.wsfallback);

                        var seeds = [];
                        var bootsarr = config.appconfig.bootseeds;
                        for (var i = 0; i < bootsarr.length; i++) {
                            seeds.push(bootsarr[i]);
                        }
                        this.bootseeds(seeds);

                        var ices = [];
                        var icesarr = config.appconfig.ice_resolvers;
                        for (var i = 0; i < icesarr.length; i++) {
                            ices.push(icesarr[i]);
                        }
                        this.iceresolvers(ices);

                        this.tcpport(config.appconfig.tcpport);
                        this.wsport(config.appconfig.wsport);
                        this.selected_transport(config.appconfig.transport);
                        this.isdevmode(config.appconfig.isdevmode);
                        this.selected_loglevel(config.appconfig.loglevel);

                        if (callback) {
                            callback();
                        }
                    }
                    catch (err) {
                        streembit.notify.error("Settings init error: %j", err);
                    }
                },

                save: function () {
                    try {
                        var data = streembit.Session.settings.data

                        data.bootseeds = viewModel.bootseeds();
                        data.transport = viewModel.selected_transport();

                        var num = parseInt($.trim(viewModel.tcpport()));
                        if (isNaN(num)) {
                            num = streembit.DEFS.APP_PORT
                        }
                        data.tcpport = num;

                        num = parseInt($.trim(viewModel.wsport()));
                        if (isNaN(num)) {
                            num = streembit.DEFS.WS_PORT
                        }
                        data.wsport = num;

                        data.wsfallback = viewModel.iswsfallback();

                        data.ice_resolvers = viewModel.iceresolvers();
                        data.isdevmode = viewModel.isdevmode();

                        data.loglevel = viewModel.selected_loglevel() || "debug";

                        data.private_net_seed = { "account": "", "host": "", "port": 0 };
                        data.private_net_seed.account = viewModel.private_net_account();
                        data.private_net_seed.host = viewModel.private_net_address();

                        num = parseInt($.trim(viewModel.private_net_port()));
                        if (isNaN(num)) {
                            num = 0
                        }
                        data.private_net_seed.port = num;

                        streembit.Session.update_settings(data, function (err) {
                            if (err) {
                                return streembit.notify.error_popup("Error in updating the settings database. Error: " + err.message);
                            }
                            streembit.notify.success("The settings data was updated successfully");
                        });
                    }
                    catch (e) {
                        return streembit.notify.error_popup("Exception occured in updating the settings database. Error: " + e.message);
                    }
                },

                delete_bootseed: function (seed) {
                    viewModel.bootseeds.remove(function (item) {
                        return item == seed;
                    });
                    viewModel.save();
                },

                add_bootseed: function () {
                    var seed_host = $.trim(viewModel.new_seed_host());
                    var seed_port = $.trim(viewModel.new_seed_port());
                    var seed_publickey = $.trim(viewModel.new_seed_publickey());
                    if (!seed_host || !seed_port || !seed_publickey || isNaN(parseInt(seed_port))) {
                        return streembit.notify.error_popup("Invalid seed data. The host IP address or domain name, port and public key are required.");
                    }

                    var seed = { "address": seed_host, "port": parseInt(seed_port), "public_key": seed_publickey };
                    viewModel.bootseeds.push(seed);
                    viewModel.save();
                    viewModel.new_seed_host("");
                    viewModel.new_seed_port("");
                    viewModel.new_seed_publickey("");
                    viewModel.is_add_bootseed(false);
                },

                add_iceresolver: function () {
                    var newice = $.trim(viewModel.new_iceresolver());
                    if (newice) {
                        // validate
                        var obj = { "url": newice }
                        viewModel.iceresolvers.push(obj);
                        viewModel.new_iceresolver("");
                        viewModel.is_add_iceresolver(false);
                    }
                },

                delete_iceresolver: function (ice) {
                    viewModel.iceresolvers.remove(function (item) {
                        return item.url == ice.url;
                    });
                },

                initui: function () {
                    $('[data-toggle="popover"]').popover();
                }
            };

            viewModel.init();

            return viewModel;
        }           

        return {
            viewModel: SettingsVm,
            template: template
        };
    });

}());



