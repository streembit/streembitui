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


var async = require("async");
var net = require("net");
var dns = require('dns');

var streembit = streembit || {};

streembit.bootclient = (function (module, logger, config, events) {
    
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
    
    function is_ipaddress(address) {
        var ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/; // /^(\d{ 1, 3 })\.(\d { 1, 3 })\.(\d { 1, 3 })\.(\d { 1, 3 })$/;   
        var valid = ipPattern.test(address);
        return valid;
    }
    
    function get_seed_ipaddress(address, callback) {
        if (!address) {
            return callback("get_seed_ipaddress error: invalid address");
        }
        
        var isip = is_ipaddress(address);
        if (isip) {
            return callback(null, address);
        }
        
        dns.resolve4(address, function (err, addresses) {
            if (err) {
                return callback(err);
            }
            
            if (!addresses || !addresses.length) {
                return callback("dns resolve failed to get addresses");
            }
            
            callback(null, addresses[0]);
        });
    }
    
    //function get_seeds(remoteuri, port, callback) {
    //    try {
            
    //        const http = require('http');
            
    //        var options = {
    //            host: remoteuri,
    //            port: port || streembit.DEFS.BOOT_PORT,
    //            path: '/seeds',
    //            method: 'POST'
    //        };
            
    //        var request = http.request(options, function (response) {
    //            var body = '';
    //            response.on("data", function (chunk) {
    //                body += chunk.toString('utf8');
    //            });
                
    //            response.on("end", function () {
    //                try {
    //                    var data = JSON.parse(body);
    //                    if (!data || !data.result || !data.result.seeds || !data.result.seeds.length) {
    //                        callback("get_seeds() error: invalid result");
    //                    }
    //                    else {
    //                        callback(null, data.result);
    //                    }
    //                }
    //                catch (err) {
    //                    callback("get_seeds response-end parse error: " + err.message);
    //                }
    //            });
    //        });
            
    //        request.on('error', function (e) {
    //            callback("get_seeds() error: " + e.message);
    //        });
            
    //        request.end();

    //    }
    //    catch (e) {
    //        callback("get http client error: " + e.message);
    //    }
    //};
    
    //function normalize_seeds(list) {
        
    //    var seeds = [];

    //    if (list || list.length > 0) {
    //        for (var i = 0; i < list.length; i++) {
    //            if (list[i].account == streembit.User.name) {
    //                continue;
    //            }
                
    //            var exists = false;
    //            for (var j = 0; j < seeds.length; j++) {
    //                if (seeds[j].account == list[i].account) {
    //                    exists = true;
    //                    break;
    //                }
    //            }
                
    //            if (!exists) {
    //                seeds.push(list[i]);
    //            }
    //        }
    //    }      

    //    return seeds;
    //}
    
    module.tcp_resolve = function (seeds, callback) {
        logger.debug("bootclient tcp_resolve()");

        if (!seeds || !Array.isArray(seeds) || seeds.length == 0) {
            return callback(null, seeds);
        }
        
        async.map(
            seeds,
            function (seed, done) {
                var result = {};
                try {
                    // get the IP address
                    get_seed_ipaddress(seed.address, function (err, address) {
                        if (err) {
                            result.error = err;
                            return done(null, result);
                        }
                        
                        result.address = address;
                        result.port = seed.port;
                        result.public_key = seed.public_key;
                        done(null, result);
                    });
                }
                catch (e) {
                    result.error = e;
                    done(null, result);
                }
            },
            function (err, results) {
                if (err || results.length == 0) {
                    return callback("Failed to resolve any seed address");
                }
                
                var seedlist = [];
                results.forEach(function (item, index, array) {
                    if (item.address && !item.error) {
                        seedlist.push({ address: item.address, port: item.port, public_key: item.public_key });
                    }
                });
                
                callback(null, seedlist);
            }
        );

        //var discovery_srvs = [];
        //var bootseeds = [];
        
        //if (!seedsarr || seedsarr.length == 0) {
        //    return callback("bootseeds configuration is missing");
        //}        
        
        //for (var i = 0; i < seedsarr.length; i++) {
        //    bootseeds.push(seedsarr[i]);
        //}
        
        //do {

        //    if (bootseeds.length <= 1) {
        //        if (bootseeds.length == 1) {
        //            discovery_srvs.push(
        //                {
        //                    host: bootseeds[0].host ? bootseeds[0].host : bootseeds[0], 
        //                    port: bootseeds[0].port ? bootseeds[0].port : streembit.DEFS.BOOT_PORT
        //                });
        //        }
        //        break;
        //    }

        //    var shuffle = shuffleItem(bootseeds);
        //    discovery_srvs.push(
        //        {
        //            host: shuffle.result.host ? shuffle.result.host : shuffle.result, 
        //            port: shuffle.result.port ? shuffle.result.port : streembit.DEFS.BOOT_PORT
        //        }
        //    );
            
        //} while (bootseeds.length > 0);
        
        //if (discovery_srvs.length == 0) {
        //    return callback("invalid boot discovery services array");
        //}
 
        //var index = 0;
        //var bootresult = 0;
        
        //async.whilst(
        //    function () {
        //        var incomplete = !bootresult && !bootresult.seeds && index < discovery_srvs.length;
        //        return incomplete;
        //    },
        //    function (asyncfn) {
        //        var host = discovery_srvs[index].host;
        //        var port = discovery_srvs[index].port;
        //        index++;
        //        logger.debug("get_seeds domain: " + host + ":" + port);
        //        events.emit(events.APPEVENT, events.TYPES.ONINITPROGRESS, "Querying seeds from " + host + ":" + port);     
        //        get_seeds(host, port, function (err, result) {
        //            if (err) {
        //                logger.debug("get_seeds error: %j", err);
        //                asyncfn(null, []);
        //            }
        //            else {
        //                bootresult = result;
        //                asyncfn(null, bootresult);
        //            }
        //        });
        //    },
        //    function (err, result) {
        //        // normalize the seed list by removing the duplicates
        //        if (bootresult && bootresult.seeds && bootresult.seeds.length > 0) {
        //            var seeds = normalize_seeds(bootresult.seeds);
        //            bootresult.seeds = seeds;
        //            callback(null, bootresult);
        //        }
        //        else {
        //            callback("Error in populating the seed list. Please make sure the bootseeds configuration is correct and a firewall doesn't block the Streembit software!");
        //        }
        //    }
        //);
        
    }
    
    module.ws_resolve = function (bootseeds, callback) {
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
                                port: bootseeds[0].port ? bootseeds[0].port : streembit.DEFS.WS_PORT
                            });
                    }
                    break;
                }
                
                var shuffle = shuffleItem(bootseeds);
                
                discovery_srvs.push(
                    {
                        host: shuffle.result.host ? shuffle.result.host : shuffle.result, 
                        port: shuffle.result.port ? shuffle.result.port : streembit.DEFS.WS_PORT
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
    };
    
    module.tcp_discovery = function (address, seed, callback) {
        if (is_ipaddress(address)) {
            return callback(null, address);
        }
        
        var client = net.connect( 
            {
                port: seed.port, 
                host: seed.address
            },
            function () {
                client.write(JSON.stringify({ type: 'DISCOVERY' }));
            }
        );
        
        client.on('data', function (data) {
            var reply = JSON.parse(data.toString());
            console.log("discovery reply: %j", reply);
            if (reply && reply.address) {
                var reply_address;
                var ipv6prefix = "::ffff:";
                if (reply.address.indexOf(ipv6prefix) > -1) {
                    reply_address = reply.address.replace(ipv6prefix, '');
                }
                else {
                    reply_address = reply.address;
                }                   
                
                callback(null, reply_address);
            }
            else {
                callback("discovery failed for " + seed.address + ":" + seed.port);
            }
            client.end();
        });
        
        client.on('end', function () {
        });
        
        client.on('error', function (err) {
            callback("self discovery failed with " + seed.address + ":" + seed.port + ". " + (err.message ? err.message : err));
        });
    };
    
    module.resolveseeds = function (seeds, callback) {
        var transport = config.transport;
        if (!transport) {
            return callback("transport configuration is missing");
        }

        switch (transport) {
            case streembit.DEFS.TRANSPORT_TCP:
                module.tcp_resolve(seeds, callback);
                break;
            case streembit.DEFS.TRANSPORT_WS:
                module.ws_resolve(seeds, callback);
                break;
            default:
                return callback("resolveseeds error, not implemented transport type: " + config.transport);
        }        
    }
    
    module.discovery = function (address, seed, callback) {
        var transport = config.transport;
        if (!transport) {
            return callback("transport configuration is missing");
        }
        
        switch (transport) {
            case streembit.DEFS.TRANSPORT_TCP:
                module.tcp_discovery(address, seed, callback);
                break;
            case streembit.DEFS.TRANSPORT_WS:
                callback();
                break;
            default:
                return callback("discovery error, not implemented transport type: " + config.transport);
        }
    }
    
    return module;

}(streembit.bootclient || {}, streembit.logger, streembit.config, global.appevents));
