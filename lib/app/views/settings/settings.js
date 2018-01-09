/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    define([ 'i18next', 'settings', 'logger', 'definitions', './settings.html!text'], function ( i18next, settings, logger, defs, template) {

        function SettingsVm() {

            var viewModel = {
                iswsfallback: ko.observable(false),
                iswspublish: ko.observable(false),
                bootseeds: ko.observableArray([]),
                iceresolvers: ko.observableArray([]),
                tcpport: ko.observable(0),
                wshost: ko.observable(''),
                wsport: ko.observable(0),
                selected_transport: ko.observable(),
                is_add_bootseed: ko.observable(false),
                new_seed_host: ko.observable(""),
                new_seed_port: ko.observable("32320"),
                new_seed_publickey: ko.observable(""),
                new_iceresolver: ko.observable(""),
                is_add_iceresolver: ko.observable(false),
                private_net_account: ko.observable(""),
                private_net_port: ko.observable(""),
                private_net_address: ko.observable(""),
                selected_loglevel: ko.observable(),
                nwmode: ko.observable(streembit.globals.nwmode),

                init: function (callback) {
                    try {
                        var self = this;

                        settings.getdata(function (err, data) {
                            try {
                                if (err) {
                                    return streembit.notify.error("Settings init error: %j", err);
                                }

                                if (!data) {
                                    if (callback) {
                                        callback();
                                    }
                                    return;
                                }

                                self.iswsfallback(data.wsfallback);
                                self.iswspublish(data.wspublish);

                                var seeds = [];
                                var bootsarr = data.bootseeds;
                                if (bootsarr && Array.isArray(bootsarr)) {
                                    for (var i = 0; i < bootsarr.length; i++) {
                                        if (!bootsarr[i].port) {
                                            bootsarr[i].port = defs.DEFAULT_SEED_PORT;
                                        }
                                        seeds.push(bootsarr[i]);
                                    }
                                }
                                self.bootseeds(seeds);

                                var ices = [];
                                var icesarr = data.ice_resolvers;
                                for (var i = 0; i < icesarr.length; i++) {
                                    ices.push(icesarr[i]);
                                }
                                self.iceresolvers(ices);

                                self.tcpport(data.tcpport);
                                self.wshost(data.wshost);
                                self.wsport(data.wsport);
                                self.selected_transport(data.transport);
                                self.selected_loglevel(data.loglevel);

                                if (data.private_net_seed) {
                                    if (data.private_net_seed.account) {
                                        self.private_net_account(data.private_net_seed.account);
                                    }
                                    if (data.private_net_seed.host) {
                                        self.private_net_host(data.private_net_seed.host);
                                    }
                                    if (data.private_net_seed.port) {
                                        self.private_net_port(data.private_net_seed.port);
                                    }
                                }

                                if (callback) {
                                    callback();
                                }
                            }
                            catch (err) {
                                streembit.notify.error("Settings init error: %j", err);
                            }
                        });                        
                    }
                    catch (err) {
                        streembit.notify.error("Settings init error: %j", err);
                    }
                },

                save: function () {
                    try {
                        var data = {};

                        data.bootseeds = viewModel.bootseeds();
                        data.transport = viewModel.selected_transport();

                        var num = parseInt($.trim(viewModel.tcpport()));
                        if (isNaN(num)) {
                            num = defs.APP_PORT || 8905;
                        }
                        data.tcpport = num;

                        num = parseInt($.trim(viewModel.wsport()));
                        if (isNaN(num)) {
                            num = defs.WS_PORT || 32317;
                        }
                        data.wsport = num;

                        data.wshost = $.trim(viewModel.wshost());

                        data.wsfallback = viewModel.iswsfallback();
                        data.wspublish = viewModel.iswspublish();

                        data.askwspublish = true;
                        data.askwsfallback = true;

                        data.ice_resolvers = viewModel.iceresolvers();
      
                        data.loglevel = viewModel.selected_loglevel() || "debug";

                        data.private_net_seed = { "account": "", "host": "", "port": 0 };
                        data.private_net_seed.account = viewModel.private_net_account();
                        data.private_net_seed.host = viewModel.private_net_address();

                        num = parseInt($.trim(viewModel.private_net_port()));
                        if (isNaN(num)) {
                            num = 0
                        }
                        data.private_net_seed.port = num;

                        settings.update(data, function (err) {
                            if (err) {
                                streembit.notify.error("Error in updating the settings database. Error: " + err.message);
                            }
                            else {
                                logger.debug("Updated settings in database");
                                streembit.notify.success("The settings data was updated successfully");
                            }
                        });
                    }
                    catch (e) {
                        return streembit.notify.error("Exception occured in updating the settings database. Error: " + e.message);
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
                    if (!seed_host || !seed_port || isNaN(parseInt(seed_port))) {
                        return streembit.notify.error("Invalid seed data. The host IP address or domain name and port key are required.");
                    }

                    var seed = { "address": seed_host, "port": parseInt(seed_port) };
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
                    jQuery("[rel=popover], [data-rel=popover]").popover();
                }
            };

            viewModel.init();

            setTimeout(() => {
                viewModel.initui();
            },
            500);

            return viewModel;
        }       

        return {
            viewModel: SettingsVm,
            template: template
        };
    });

}());



