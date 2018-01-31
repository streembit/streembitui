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

    define(['i18next', 'settings', 'logger', 'definitions', 'apputils', './settings.html!text'],
        function (i18next, settings, logger, defs, apputils, template) {

            function SettingsVm() {

                var viewModel = {
                    iswspublish: ko.observable(false),
                    bootseeds: ko.observableArray([]),
                    iceresolvers: ko.observableArray([]),
                    tcpport: ko.observable(0),
                    selected_transport: ko.observable(),
                    is_add_bootseed: ko.observable(false),
                    new_seed_host: ko.observable(""),
                    new_seed_port: ko.observable("32320"),
                    new_seed_publickey: ko.observable(""),
                    new_iceresolver: ko.observable(""),
                    is_add_iceresolver: ko.observable(false),
                    selected_loglevel: ko.observable(),
                    nwmode: ko.observable(streembit.globals.nwmode),
                    is_edit_bootseed: ko.observable(false),
                    edit_seed_host: ko.observable(),
                    edit_seed_port: ko.observable(),
                    current_host: ko.observable(),
                    address: ko.observable(),
                    peers_remote_url: ko.observable(),

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

                                    var seeds = [];
                                    var bootsarr = data.bootseeds;
                                    if (bootsarr && Array.isArray(bootsarr)) {
                                        for (var i = 0; i < bootsarr.length; i++) {
                                            if (!bootsarr[i].port) {
                                                bootsarr[i].port = defs.DEFAULT_SEED_PORT;
                                            }
                                            var peer = bootsarr[i];
                                            peer.pingstatus = ko.observable("Pinging ...");
                                            seeds.push(peer);
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

                                    self.selected_transport(data.transport);
                                    self.selected_loglevel(data.loglevel);

                                    self.peers_remote_url(data.wspeerlisturl);

                                    if (callback) {
                                        callback();
                                    }

                                    function ping(item) {
                                        try {
                                            apputils.ping(item.host, item.port, (err, elapsed) => {
                                                if (err) {
                                                    item.pingstatus("Ping failed");
                                                }
                                                else {
                                                    item.pingstatus("Ping time: " + elapsed + " ms");
                                                }
                                            });
                                        }
                                        catch (err) {
                                            item.pingstatus("Ping failed");
                                        }
                                    }   

                                    // PING to the seeds
                                    self.bootseeds().forEach(
                                        (item) => {
                                            ping(item);
                                        }
                                    );

                                //
                                }
                                catch (err) {
                                    streembit.notify.error("Settings init error: %j", err);
                                }
                            }
                        );                        
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

                        data.ice_resolvers = viewModel.iceresolvers();
      
                        data.loglevel = viewModel.selected_loglevel() || "debug";

                        // the isaccountexists should not change here
                        var isaccountexists = settings.isaccountexists;
                        data.isaccountexists = isaccountexists;

                        data.wspeerlisturl = viewModel.peers_remote_url();

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
                edit_bootseed: function (seed) {
                    $('#editSeedModal').modal();
                    window.seed = seed;
                    window.seed_address = seed.host;
                    window.seed_port = seed.port;
                    viewModel.edit_seed_host(window.seed_address);
                    viewModel.edit_seed_port(window.seed_port);
                }, 
                update_seed: function(){
                    ko.utils.arrayFilter(viewModel.bootseeds(), function(a,b){
                        if (a.host == window.seed_address){
                            window.seed.host = viewModel.edit_seed_host();
                            window.seed.port = viewModel.edit_seed_port();
                            viewModel.save();
                        }
                        $('#editSeedModal').modal('hide');
                        viewModel.init();
                    })
                }, 
                add_bootseed: function () {
                    var seed_host = $.trim(viewModel.new_seed_host());
                    var seed_port = $.trim(viewModel.new_seed_port());
                    if (!seed_host || !seed_port || isNaN(parseInt(seed_port))) {
                        return streembit.notify.error("Invalid seed data. The host IP address or domain name and port key are required.");
                    }

                    var seed = { "host": seed_host, "port": parseInt(seed_port) };
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



