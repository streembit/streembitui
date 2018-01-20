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

    var appevents = require("appevents");
    var logger = require('./logger');   
    var defs = require('./definitions');
    var settings = require('./settings');
    var appsrvc = require('./appsrvc');
    var uihandler = require('./uihandler');
    var WsNet = require('./transport_wsnet.js');

    var peernet = {};

    // this is the application net client
    peernet.netclient = null;

    // this stores the ws handlers
    // contacts could use different WS peers and this stores the 
    // WS handlers for each connections
    peernet.wshandler = {};

    Object.defineProperty(peernet, 'client', {
        get: function () {
            return peernet.netclient;
        },
        set: function (value) {
            peernet.netclient = value;
        }
    })

    function netfactory(transport) {
        if ((streembit && streembit.globals && streembit.globals.nwmode) && transport == defs.TRANSPORT_TCP) {
            if (!settings.tcpport) {
                throw new Error("invalid TCP port settings, please define the TCP port in the settings view.")
            }
            var PeerNet = nwrequire('./transport_peernet');
            return new PeerNet();
        }
        else {
            return new WsNet();
        }
    }

    peernet.getseeds = function () {
        if (!peernet.netclient) {
            return [];
        }
        else {
            if (peernet.netclient.getseeds && typeof peernet.netclient.getseeds == "function") {
                return peernet.netclient.getseeds();
            }
            else {
                return [];
            }
        }
    }

    peernet.connect = function (transport, callback) {
        appsrvc.net_connected = false;

        peernet.netclient = netfactory(transport);
        peernet.netclient.init(callback);
    }

    peernet.peer_send = function (contact, data) {
        function get_contact_transport(contact) {
            // if the contact use WS send it via WS 
            if (contact.protocol == defs.TRANSPORT_WS) {
                return peernet.getwshandler(contact.address, contact.port);
            }      

            //  the contact uses TCP client, this use is TCP client the 
            //  PeerNet instance must exist and return that
            return peernet.netclient;
        }

        if (!contact || !contact.protocol || !contact.address ) {
            throw new Error("Invalid contact object. The connection data from your contact is not available.");
        }

        // select a transport based on the contact's protocol
        var transport = get_contact_transport(contact);
        transport.peer_send(contact, data);
    }

    peernet.put = function (key, value, callback) {

        //var put_via_ws = function (k, v, donecb) { 
        //    var url = 'ws://' + appsrvc.wshost + ":" + appsrvc.wsport + "/put";
        //    var data = { "account": appsrvc.username, "key": k, "value": v };
        //    $.ajax({
        //        url: url,
        //        type: "POST",
        //        data: JSON.stringify(data),
        //        contentType: "application/json; charset=utf-8",
        //        cache: false,
        //        success: function (response) {
        //            donecb(null, response);
        //        },
        //        error: function (request, status, error) {
        //            donecb(error ? error : "ajax POST error");
        //        }
        //    });
        //};

        //var wspeer_proc = function (k, v) {
        //    peernet.netclient.put(k, v, callback);
        //};

        var dhtpeer_proc = function (k, v) {
            //  return the callback immediatelly and then try to register 
            //  with WS as well if it is needed

            if (self.validate_ws_publish()) {
                // TODO send it to a WS peer 

                // put to WS hub
                //put_via_ws(k, v, function (err, response) {
                //    if (err) {
                //        streembit.notify.error("WS put error %j", err, true);
                //    }
                //    if (!response || !response.hasOwnProperty("result") || response.result != 0) {
                //        streembit.notify.error("Invalid websrvc response or websrvc failed", null, true);
                //    }
                //    else {
                //        logger.info("put completed at websrvc put");
                //    }
                //});
            }
        };

        // send it via the transport
        peernet.netclient.put(key, value, callback);

        if (appsrvc.transport == defs.TRANSPORT_TCP) {
            dhtpeer_proc(key, value);            
        }        
    };


    peernet.on_net_event = function (method, param1, param2, param3) {
    }

    peernet.register_at_ws = function () {

        if (appsrvc.transport == defs.TRANSPORT_WS) {
            // the contact was registered already
            return;
        }

        if (!this.validate_ws_publish()) {
            return;
        }

        // process for WS        

        // register at WS hub
        //var resultfunc = function (err, data) {
        //    if (err) {
        //        streembit.notify.error("WS register error %j", err, true);
        //    }
        //    else if (!data || !data.hasOwnProperty("result") || data.result != 0) {
        //        streembit.notify.error("Invalid websrvc response at contact register", (data && data.error) ? data.error : null, true);
        //    }
        //    else {
        //        logger.info("register contact at websrvc");                       
        //    }
        //}

        //var url = 'ws://' + appsrvc.wshost + ":" + appsrvc.wsport + "/register_contact";
        //var data = {
        //    "account": appsrvc.username,
        //    "publickey": appsrvc.publicKeyBs58,
        //    "pkhash": appsrvc.pubkeyhash,
        //    "transport": appsrvc.transport,
        //    "type": appsrvc.usertype
        //};

        //$.ajax({
        //    url: url,
        //    type: "POST",
        //    data: JSON.stringify(data),
        //    contentType: "application/json; charset=utf-8",
        //    cache: false,
        //    success: function (response) {
        //        resultfunc(null, response);
        //    },
        //    error: function (request, status, error) {
        //        resultfunc(error ? error : "ajax POST error");
        //    }
        //});
             
        //
    };

    peernet.find_contact = function (account, callback) {

        if (!account) {
            return callback("invalid account parameter");
        }

        if(appsrvc.transport == defs.TRANSPORT_WS) {
            peernet.netclient.find_contact(account, callback);
        }
        else {
            // TODO

            /*
            var resultfunc = function (err, data) {
                if (err) {
                    callback(err);
                }
                else if (!data || !data.hasOwnProperty("result") || data.result != 0) {
                    callback((data && data.error) ? data.error : "WebSocket hub error");
                }
                else if (!data.contact) {
                    callback(null);
                }
                else {
                    var contact = data.contact;
                    if (!contact.protocol) {
                        // finding contact by name is only possible on the WS hub
                        contact.protocol = "ws";
                    }
                    if (!contact.address) {
                        // use the same address, the contact data must be there
                        contact.address = appsrvc.wshost;
                    }
                    if (!contact.port) {
                        // use the same address, the contact data must be there
                        contact.port = appsrvc.wsport;
                    }

                    callback(null, contact);
                }
            }

            var url = 'ws://' + appsrvc.wshost + ":" + appsrvc.wsport + "/find_contact";
            var data = {
                "account": account
            };
            var param = JSON.stringify(data);

            $.ajax({
                url: url,
                type: "POST",
                data: param,
                contentType: "application/json; charset=utf-8",
                cache: false,
                success: function (response) {
                    resultfunc(null, response);
                },
                error: function (request, status, error) {
                    resultfunc(error ? error : "ajax POST error");
                }
            });
            */
        }
    };

    peernet.validate_ws_publish = function () {
        var usews = false;
        var wspublish = settings.wspublish;
        if (wspublish) {
            // register at WS hub
            usews = true;
        }
        else if (!wspublish && !settings.ask_about_wspublish) {
            // ask about ws publish
            usews = uihandler.getconfirm(defs.APPMSG_WSPUBLISHPROMPT);
            settings.wspublish = usews;
            settings.ask_about_wspublish = true;
        }

        return usews;        
    }

    peernet.getwshandler = function (address, port) {
        var key = address + ":" + port;
        if (!peernet.wshandler[key]) {
            peernet.wshandler[key] = new WsNet(address, port);
        }
        return peernet.wshandler[key];
    }

    peernet.get_transport = function (contact_transport, contact_address, contact_port) {
        if (!contact_transport) {
            //  at least the contact transport must be defined (if it was find via the WS hub then it must be ws,
            //  if it was added offline then the contact offer should include the prorocol as well )
            throw new Error("invalid contact protocol, the contact protocol must exist");
        }

        // check if the ws handler exists
        if (contact_transport == defs.TRANSPORT_WS) {
            return peernet.getwshandler(contact_address, contact_port);
        }
        else {
            // TODO
            // work out if the contact transport is not a WS handler if the      
            return peernet.netclient;
        }
    }

    peernet.init = function () {
        peernet.netclient = null;
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            peernet.connect(settings.transport, function (err) {
                if (!err) {
                    if (settings.transport == defs.TRANSPORT_WS) {
                        appsrvc.node = peernet.netclient;
                        appsrvc.address = peernet.netclient.host;
                        appsrvc.port = peernet.netclient.port;

                        // in case if any contacts use the same WS peer then we will have it stored
                        // at the peernet.wshandler object
                        var key = peernet.netclient.host + ":" + peernet.netclient.port;
                        peernet.wshandler[key] = peernet.netclient;
                    }

                    return resolve();
                }

                logger.error("peernet.connect error %j: ", err);

                var connect_via_ws = function () {
                    // the user selcted to connect via WS
                    peernet.connect(defs.TRANSPORT_WS, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                };

                // it was an error
                if (settings.transport == defs.TRANSPORT_WS || (settings.transport == defs.TRANSPORT_TCP && (!settings.wsfallback && settings.ask_about_wsfallback))) {
                    // it seems the Websocket connection failed or the TCP failed and the WS connection is not allowed
                    return reject("Error in connecting to the Streembit network, " + (err.message ? err.message : err));
                }
                else if (settings.transport == defs.TRANSPORT_TCP && settings.wsfallback && settings.ask_about_wsfallback) {
                    // it was asked about WS already try to connect via WS
                    // the user selcted to connect via WS
                    connect_via_ws();
                }
                else if (settings.transport == defs.TRANSPORT_TCP && !settings.wsfallback && !settings.ask_about_wsfallback) {
                    // if the transport was TCP and the WS fallback is enabled then try connecting via WS 
                    // prompt and ask whether the user want to connect via WS or not
                    var usews = uihandler.getconfirm(defs.APPMSG_NOPEER_WSUSEPROMPT);
                    settings.wsfallback = usews;
                    if (!settings.ask_about_wsfallback) {
                        settings.ask_about_wsfallback = true;
                    }
                    if (!usews) {
                        return reject("Not connected to the Streembit network. Error: " + (err.message ? err.message : err));
                    }

                    connect_via_ws();
                }
                else {
                    reject(err);
                }
            });
        });
    };

    peernet.ping_to_net = function () {
        if (!appsrvc.net_connected) {
            return alert("Unable to ping. You are not connected to the Streembit network");
        }
        alert("ping to net");
    };

    peernet.load = function () {
        var self = this;
        return new Promise((resolve, reject) => {
            appevents.addListener("onnetevent", peernet.on_net_event);
            resolve();
        });
    };

    module.exports = peernet;

})();