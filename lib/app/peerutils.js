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

This is just to be able to call the NodeJs library from node-webkit using "require" and then use it in the
ECMASCRIPT 6 compatible modules which use "import" (instead of require)

*/

(function () { 
    var logger = require("./logger");

    function is_ipaddress(address) {
        var ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/; // /^(\d{ 1, 3 })\.(\d { 1, 3 })\.(\d { 1, 3 })\.(\d { 1, 3 })$/;   
        var valid = ipPattern.test(address);
        return valid;
    }

    module.exports.discovery = function (seeds, callback) {
        var result_ipaddress = 0;

        var net = nwrequire("net");

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

        var async = nwrequire("async");

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
    }

    module.exports.kad = nwrequire('streembitlib/kadlib');
    module.exports.upnp = nwrequire('streembitlib/upnp/nat-upnp');

})();