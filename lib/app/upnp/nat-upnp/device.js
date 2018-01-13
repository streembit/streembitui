/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

var nat = require('../nat-upnp'),
    request = nwrequire('request'),
    url = nwrequire('url'),
    xml2js = nwrequire('xml2js');

var device = exports;

function getNamespace(data, uri) {
    var ns;

    if (data['@']) {
        Object.keys(data['@']).some(function (key) {
            if (!/^xmlns:/.test(key)) return;
            if (data['@'][key] !== uri) {
                return;
            }

            ns = key.replace(/^xmlns:/, '');
            return true;
        });
    }

    return ns ? ns + ':' : '';
};


function Device(url, _logger) {
    this.description = url;
    this.services = [
        'urn:schemas-upnp-org:service:WANIPConnection:1',
        'urn:schemas-upnp-org:service:WANPPPConnection:1'
    ];
    this.logger = _logger;
};

device.create = function create(url, _logger) {
    return new Device(url, _logger);
};

Device.prototype._getXml = function _getXml(url, callback) {
    var once = false;
    
    function respond(err, body) {
        if (once) {
            return;
        }

        once = true;

        callback(err, body);
    }

    request(url, function(err, res, body) {
        if (err) {
            return callback(err);
        }

        if (res.statusCode !== 200) {
            respond(Error('Failed to lookup device description'));
            return;
        }

        var parser = new xml2js.Parser();
        parser.parseString(body, function(err, body) {
            if (err) {
                return respond(err);
            }

            respond(null, body);
        });
    });
};

Device.prototype.getService = function getService(types, callback) {
    var self = this;

    this._getXml(this.description, function (err, info) {
        if (err)  {
            return callback(err);
        }

        var s = self.parseDescription(info).services.filter(function(service) {
            return types.indexOf(service.serviceType) !== -1;
        });

        if (s.length === 0 || !s[0].controlURL || !s[0].SCPDURL) {
            return callback(Error('Service not found'));
        }

        var base = url.parse(info.baseURL || self.description);
        
        function prefix(u) {
            var uri = url.parse(u);
            uri.host = uri.host || base.host;
            uri.protocol = uri.protocol || base.protocol;

            return url.format(uri);
        }

        callback(null,{
            service: s[0].serviceType,
            SCPDURL: prefix(s[0].SCPDURL),
            controlURL: prefix(s[0].controlURL)
        });

    });
};

Device.prototype.parseDescription = function parseDescription(info) {
    if (!info) {
        return this.logger.debug("upnp invalid info at device parseDescription");
    }

    var services = [],
        devices = [];

    function toArray(item) {
        return Array.isArray(item) ? item : [ item ];
    };

    function traverseServices(service) {
        if (!service) {
            return;
        }

        services.push(service);
    }

    function traverseDevices(device) {
        if (!device) {
            this.logger.debug("upnp invalid device at traverseDevices");
            return;
        }

        devices.push(device);

        if (device.deviceList && device.deviceList.device) {
            toArray(device.deviceList.device).forEach(traverseDevices);
        }

        if (device.serviceList && device.serviceList.service) {
            toArray(device.serviceList.service).forEach(traverseServices);
        }
    }

    traverseDevices(info.device);

    return {
        services: services,
        devices: devices
    };
};

Device.prototype.run = function run(action, args, callback) {
    var self = this;
    
    this.logger.debug("upnp action: " + action);

    this.getNamespace = function(data, uri) {
        var ns;

        if (data['@']) {
            Object.keys(data['@']).some(function (key) {
                if (!/^xmlns:/.test(key)) return;
                if (data['@'][key] !== uri) {
                    return;
                }

                ns = key.replace(/^xmlns:/, '');
                return true;
            });
        }

        return ns ? ns + ':' : '';
    };

    this.getService(this.services, function(err, info) {
        if (err) {
            return callback(err);
        }
        
        self.logger.debug("upnp controlURL: " + info.controlURL);

        var body =  
            '<?xml version="1.0"?>' +
            '<s:Envelope ' +
            'xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" ' +
            's:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
            '<s:Body>' + 
            '<u:' + action + ' xmlns:u=' + JSON.stringify(info.service) + '>' + 
            args.map(
                function (args) {
                    return '<' + args[0]+ '>' + (args[1] === undefined ? '' : args[1]) + '</' + args[0] + '>';
            }).join('') +
            '</u:' + action + '>' +
            '</s:Body>' +
            '</s:Envelope>';
        
        self.logger.debug("send upnp getService request: " + body);

        request({
            method: 'POST',
            url: info.controlURL,
            headers: {
                'Content-Type': 'text/xml; charset="utf-8"',
                'Content-Length': Buffer.byteLength(body),
                'Connection': 'close',
                'SOAPAction': JSON.stringify(info.service + '#' + action)
            },
            body: body
        }, 
        function (err, res, result) {
            try {
                if (err) {
                    return callback(err);
                }

                var parser = new xml2js.Parser();
                parser.parseString(result, function (err, parsed) {
                    if (res.statusCode !== 200) {
                        var msg = "UPnP request failed. Server status code: " + res.statusCode;
                        if (parsed && parsed["s:Body"]) {
                            var fault = parsed["s:Body"]["s:Fault"];
                            if (fault && fault.detail && fault.detail.UPnPError && fault.detail.UPnPError && fault.detail.UPnPError.errorCode) {
                                msg += " Error code: " + fault.detail.UPnPError.errorCode;
                                if (fault.detail.UPnPError.errorDescription) {
                                    msg += ", " + fault.detail.UPnPError.errorDescription;
                                }
                            }
                        }
                        return callback(Error(msg));
                    }

                    var soapns = self.getNamespace(parsed, 'http://schemas.xmlsoap.org/soap/envelope/');
                    callback(null, parsed[soapns + 'Body']);
                });
            }
            catch (e) {
                callback(e);
            }
        });

    });

};
