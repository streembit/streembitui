/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

if (streemio.config.transport == streemio.DEFS.TRANSPORT_TCP && global.appgui) {
    var async = require("async");
    var net = require("net");
    var restify = require('restify');
}

var streemio = streemio || {};


streemio.bootclient = (function (module, logger, config, events) {
    
    module.result = [];

    function randomIntFromInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function shuffleItem(array) {
        var len = array.length;
        var index = randomIntFromInterval(0, len - 1);
        var removed = array.splice(index, 1);
        return {
            result: removed[0],
            remaining: array
        }
    }
    
    function get_http_client(remoteuri, port) {
        remoteuri += ":";
        remoteuri += port || streemio.DEFS.BOOT_PORT;
        var client = restify.createJsonClient({
            url: remoteuri,
            version: '*',
            agent: false,
            connectTimeout: 5000,
            requestTimeout: 10000
        });
        return client;
    };
    
    function get_seeds(remoteuri, port, callback) {
        try {
            var uri = "http://" + remoteuri;
            var client = get_http_client(uri, port);
            client.post('/seeds', {}, function (err, req, res, data) {
                if (err) {
                    callback("get_seeds() error: " + err);
                }            
                else if (!data || !data.result || !data.result.seeds || !data.result.seeds.length) {
                    callback("get_seeds() error: invalid result");
                }
                else {
                    callback(null, data.result);
                }
            });
        }
        catch (e) {
            callback("get http client error: " + e.message);
        }
    };
    
    module.tcp_boot = function (bootseeds, callback) {
        logger.debug("bootclient tcp_boot()");
        var discovery_srvs = [];
        
        if (!bootseeds || bootseeds.length == 0) {
            return callback("bootseeds configuration is missing");
        }
        
        do {

            if (bootseeds.length <= 1) {
                if (bootseeds.length == 1) {
                    discovery_srvs.push(
                        {
                            host: bootseeds[0].host ? bootseeds[0].host : bootseeds[0], 
                            port: bootseeds[0].port ? bootseeds[0].port : streemio.DEFS.BOOT_PORT
                        });
                }
                break;
            }

            var shuffle = shuffleItem(bootseeds);
            discovery_srvs.push(
                {
                    host: shuffle.result.host ? shuffle.result.host : shuffle.result, 
                    port: shuffle.result.port ? shuffle.result.port : streemio.DEFS.BOOT_PORT
                }
            );
            
        } while (bootseeds.length > 0);
        
        if (discovery_srvs.length == 0) {
            return callback("invalid boot discovery services array");
        }
 
        var index = 0;
        var bootresult = 0;
        
        async.whilst(
            function () {
                var incomplete = !bootresult && !bootresult.seeds && index < discovery_srvs.length;
                return incomplete;
            },
            function (asyncfn) {
                var host = discovery_srvs[index].host;
                var port = discovery_srvs[index].port;
                index++;
                logger.debug("get_seeds domain: " + host + ":" + port);
                events.emit(events.APPEVENT, events.TYPES.ONINITPROGRESS, "Querying seeds from " + host + ":" + port);     
                get_seeds(host, port, function (err, result) {
                    if (err) {
                        logger.debug("get_seeds error: %j", err);
                        asyncfn(null, []);
                    }
                    else {
                        bootresult = result;
                        asyncfn(null, bootresult);
                    }
                });
            },
            function (err, result) {
                if (bootresult && bootresult.seeds && bootresult.seeds.length > 0) {
                    callback(null, bootresult);
                }
                else {
                    callback("Error in populating the seed list. Please make sure the bootseeds configuration is correct and a firewall doesn't block the Streemio software!");
                }
            }
        );
        
    }
    
    module.ws_boot = function (bootseeds, callback) {
        try {
            logger.debug("bootclient ws_boot()");
            
            if (!bootseeds || bootseeds.length == 0) {
                return callback("bootseeds configuration is missing");
            }
            
            var discovery_srvs = [];

            do {

                if (bootseeds.length <= 1) {
                    if (bootseeds.length == 1) {
                        discovery_srvs.push(
                            {
                                host: bootseeds[0].host ? bootseeds[0].host : bootseeds[0], 
                                port: bootseeds[0].port ? bootseeds[0].port : streemio.DEFS.WS_PORT
                            });
                    }
                    break;
                }

                var shuffle = shuffleItem(bootseeds);

                discovery_srvs.push(
                    {
                        host: shuffle.result.host ? shuffle.result.host : shuffle.result, 
                        port: shuffle.result.port ? shuffle.result.port : streemio.DEFS.WS_PORT
                    }
                );
            
            } while (bootseeds.length > 0);        

            if (discovery_srvs.length == 0) {
                return callback("invalid boot discovery services array");
            }
            
            var result = { seeds: discovery_srvs };
            callback(null, result);
        }
        catch (e) {
            callback("ws_boot error: " + e.message);
        }
    }
    
    module.boot = function (bootseed, callback) {
        if (!config.transport) {
            return callback("transport configuration is missing");
        }
        
        var transport;
        switch (config.transport) {
            case streemio.DEFS.TRANSPORT_TCP:
                transport = config.transport;
                break;
            case streemio.DEFS.TRANSPORT_WS:
                transport = config.transport;
                break;
            default:
                return callback("Not implemented transport type: " + config.transport);
        }
        
        transport += "_boot";
        module[transport](bootseed, callback);
    }
    
    return module;
}(streemio.util || {}, streemio.logger, streemio.config, global.appevents));
