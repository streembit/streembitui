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
    }
    
    module.ws_resolve = function (bootseeds, callback) {
        try {

            function shuffle(array) {
                let counter = array.length;

                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    let index = Math.floor(Math.random() * counter);

                    // Decrease counter by 1
                    counter--;

                    // And swap the last element with it
                    let temp = array[counter];
                    array[counter] = array[index];
                    array[index] = temp;
                }

                return array;
            }

            function is_seed_exists(arr, host) {
                var exists = false;
                arr.forEach(function (item, index, array) {
                    if (item.host == host) {
                        exists = true;
                    }
                });
                return exists;
            }


            logger.debug("bootclient ws_boot()");

            if (!bootseeds || bootseeds.length == 0) {
                return callback("bootseeds configuration is missing");
            }

            var temparr = [];
            for (var i = 0; i < bootseeds.length; i++) {
                temparr.push(bootseeds[i]);
            }

            var tseeds = shuffle(temparr);

            var wsservers = [];

            for (var i = 0; i < tseeds.length; i++) {
                var host = tseeds[i].address ? tseeds[i].address : tseeds[i];
                var exists = is_seed_exists(wsservers, host);
                if (!exists) {
                    wsservers.push(
                        {
                            host: host,
                            port: streembit.DEFS.WS_PORT
                        }
                    );
                }
            }         

            if (wsservers.length == 0) {
                return callback("invalid ws services array");
            }

            callback(null, wsservers);
        }
        catch (e) {
            callback("ws_boot error: " + e.message);
        }
    };
    
    module.tcp_discovery = function (address, seeds, callback) {
        if (is_ipaddress(address)) {
            return callback(null, address);
        }
        
        if (!seeds || !Array.isArray(seeds) || seeds.length == 0) {
            return callback("invalid seeds parameters at address discovery");
        }
        
        var result_ipaddress = 0;
        
        function discover_address(seed, asyncfn) {
            if (result_ipaddress) {
                return asyncfn(null, true);
            }
            
            var tcpclient = net.connect( 
                {
                    port: seed.port, 
                    host: seed.address
                },
                function () {
                    tcpclient.write(JSON.stringify({ type: 'DISCOVERY' }));
                }
            );
            
            tcpclient.on('data', function (data) {
                tcpclient.end();
                var reply = JSON.parse(data.toString());
                if (reply && reply.address) {
                    var ipv6prefix = "::ffff:";
                    if (reply.address.indexOf(ipv6prefix) > -1) {
                        reply.address = reply.address.replace(ipv6prefix, '');
                    }
                    
                    if (is_ipaddress(reply.address)) {
                        result_ipaddress = reply.address;
                        asyncfn(null, true);
                    }
                    else {
                        asyncfn(null, false);
                    }
                }
                else {
                    logger.error("address discovery failed at " + seed.address + ":" + seed.port);
                    asyncfn(null, false);
                }
            });
            
            tcpclient.on('end', function () {
            });
            
            tcpclient.on('error', function (err) {
                logger.error("address discovery failed at " + seed.address + ":" + seed.port + ". " + (err.message ? err.message : err));
                asyncfn(null, false);
            });
        }
        
        
        async.detectSeries(
            seeds, 
            discover_address, 
            function (err, result) {
                if (result_ipaddress) {
                    callback(null, result_ipaddress);
                }
                else {
                    return callback("IP address discovery failed");
                }
            }
        );

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
                callback(null, "");
                break;
            default:
                return callback("discovery error, not implemented transport type: " + config.transport);
        }
    }
    
    return module;

}(streembit.bootclient || {}, streembit.logger, streembit.config, global.appevents));
