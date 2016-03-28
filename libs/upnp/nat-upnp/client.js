/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streemio software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/

var nat = require('../nat-upnp');
var async = require('async');

var client = exports;

function Client(_logger) {
    this.ssdp = nat.ssdp.create();
    this.timeout = 1800;
    this.logger = _logger;

    this.logger.debug("upnp client create");
}

client.create = function create(_logger) {
    return new Client(_logger);
};

function normalizeOptions(options) {
    function toObject(addr) {
        if (typeof addr === 'number') {
            return { port: addr };
        }

        if (typeof addr === 'object') {
            return addr;
        }

        return {};
    }

    return {
        remote: toObject(options.public),
        internal: toObject(options.private)
    };
}

Client.prototype.portMapping = function portMapping(options, callback) {
    var self = this;

    if (!callback) {
        callback = function () { };
    }
    
    this.logger.debug("upnp AddPortMapping internal IP: " + options.private + " remote IP: " + options.public);

    this.findGateway(function(err, gateway, address, local_address) {
        if (err) {
            self.logger.debug("findGateway error: %j", err);
            return callback(err);
        }
        
        self.upnp_gateway = address;
        self.upnp_local_address = local_address;

        var ports = normalizeOptions(options);

        gateway.run(
            'AddPortMapping', 
            [
                [ 'NewRemoteHost', ports.remote.host ],
                [ 'NewExternalPort', ports.remote.port ],
                [ 'NewProtocol', options.protocol ? options.protocol.toUpperCase() : 'TCP' ],
                [ 'NewInternalPort', ports.internal.port ],
                [ 'NewInternalClient', local_address ? local_address : ports.internal.host || address ],
                [ 'NewEnabled', 1 ],
                [ 'NewPortMappingDescription', options.description || 'Streemio UPNP' ],
                [ 'NewLeaseDuration', typeof options.ttl === 'number' ? options.ttl : 3600 ]
            ], 
            callback);
    });
};

Client.prototype.portUnmapping = function portMapping(options, callback) {
    if (!callback) callback = function() {};

    this.findGateway(function(err, gateway/*, address*/) {
        if (err) {
            return callback(err);
        }

        var ports = normalizeOptions(options);

        gateway.run('DeletePortMapping', [
            [ 'NewRemoteHost', ports.remote.host ],
            [ 'NewExternalPort', ports.remote.port ],
            [ 'NewProtocol', options.protocol ? options.protocol.toUpperCase() : 'TCP' ]
        ], callback);
    });
};

Client.prototype.getMappings = function getMappings(options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }

    if (!options) {
        options = {};
    }

    this.findGateway(function(err, gateway, address, local_address) {
        if (err) return callback(err);
        
        var i = 0;
        var end = false;
        var results = [];

        async.whilst(
            function () {
                return !end;
            }, 
            function (callback) {
                
                gateway.run(
                    'GetGenericPortMappingEntry', [[ 'NewPortMappingIndex', ++i ]], 
                    function (err, data) {                        
                        if (err) {
                            end = true;
                            return callback(null);
                        }

                        var key;
                        
                        Object.keys(data).some(function (k) {
                            if (!/:GetGenericPortMappingEntryResponse/.test(k))
                                return false;

                            key = k;
                            return true;
                        });
                        
                        data = data[key];

                        var result = {
                            public: {
                                host: typeof data.NewRemoteHost === 'string' && data.NewRemoteHost || '',
                                port: parseInt(data.NewExternalPort, 10)
                            },
                            
                            private: {
                                host: data.NewInternalClient,
                                port: parseInt(data.NewInternalPort, 10)
                            },
                            
                            protocol: data.NewProtocol.toLowerCase(),
                            enabled: data.NewEnabled === 1,
                            description: data.NewPortMappingDescription,
                            ttl: parseInt(data.NewLeaseDuration, 10)
                        };
                        
                        result.local = result.private.host === address;

                        results.push(result);

                        callback(null);
                    });
            }, 
            function (err) {
                if (err) return callback(err);

                if (options.local) {
                    results = results.filter(function(item) {
                        return item.local;
                    });
                }

                if (options.description) {
                    results = results.filter(function(item) {
                        if (options.description instanceof RegExp) {
                            return item.description.match(options.description) !== null;
                        } else {
                            return item.description.indexOf(options.description) !== -1;
                        }
                    });
                }

                callback(null, results);
            });
    });
};

Client.prototype.externalIp = function externalIp(callback) {
    this.findGateway(function(err, gateway/*, address*/) {
        if (err) {
            return callback(err);
        }

        gateway.run(
            'GetExternalIPAddress', 
            [], 
            function (err, data) {
                if (err)
                    return callback(err);
                
                var key;

                Object.keys(data).some(function(k) {
                    if (!/:GetExternalIPAddressResponse$/.test(k))
                        return false;

                    key = k;
                    return true;
                });

                if (!key) {
                    return callback(Error('Incorrect response'));
                }
                
                callback(null, data[key].NewExternalIPAddress);
            });
    });
};

Client.prototype.findGateway = function findGateway(callback) {
    var self = this;

    var timeout;
    var timeouted = false;
    var p = this.ssdp.search(
        'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
    );

    timeout = setTimeout(
        function () {
            timeouted = true;
            p.emit('end');
            callback(new Error('timeout'));
        }, 
        this.timeout
    );

    p.on('device', function (info, device_addres, local_address) {
        if (timeouted) {
            return;
        }

        p.emit('end');
        
        clearTimeout(timeout);

        // Create gateway
        self.logger.debug("gateway location: " + info.location + ", gateway address: " + device_addres + ", local address: " + local_address);
        callback(null, nat.device.create(info.location, self.logger), device_addres, local_address);
    });
};

Client.prototype.close = function close() {
    this.ssdp.close();
};
