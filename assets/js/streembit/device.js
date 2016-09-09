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

var streembit = streembit || {};

var async = require("async");

streembit.Device = (function (device, logger, events, config) {
    
    var connection_pending_account = null;
    
    device.parse_jsonld = function (jsonld) {
        if (!jsonld) {
            throw new Error("invalid jsonld at jsonld_parser")
        }
            
        if (!jsonld.id) {
            throw new Error("invalid id in jsonld");
        }
        
        var obj = { name: "", id: jsonld.id, interactiondefs: [] };
        
        var metadata = jsonld.metadata;
        if (metadata) {
            obj.name = metadata.name || "";
            obj.device = metadata.device || "";
            obj.model = metadata.model || "";
        }
        
        if (jsonld.interactions && Array.isArray(jsonld.interactions) && jsonld.interactions.length) {
            for (var i = 0; i < jsonld.interactions.length; i++) {
                if (!jsonld.interactions[i]["@type"] || !jsonld.interactions[i]["name"]) {
                    continue;
                }
                
                var interaction = {};

                interaction.type = jsonld.interactions[i]["@type"];
                interaction.name = jsonld.interactions[i]["name"];  
                interaction.datatype = jsonld.interactions[i]["outputData"] || "xs:string";
                interaction.writable = jsonld.interactions[i]["writable"] || false;                          
               
                obj.interactiondefs.push(interaction);
            }
        }
        
        return obj;
    }

    device.connection_pending = function () {
        var pending = connection_pending_account != null;
        connection_pending_account = null;
        return pending;
    }

    device.connect = function (device_account) {
        
        connection_pending_account = null;

        async.waterfall([  
            function (callback) {
                streembit.PeerNet.get_published_contact(device_account, callback);
            },   
            function (contact, callback) {
                streembit.Contacts.update_contact_database(contact, callback);
            },     
            function (callback) {
                // connecting to device
                logger.debug("PIFIX pinging");
                var contact = streembit.Contacts.get_contact(device_account);
                streembit.PeerNet.ping(contact, true, 20000)
                .then(
                    function () {
                        logger.debug("PIFIX ping completed");
                        callback(null, contact);
                    },
                    function (err) {
                        logger.debug("PIFIX ping failed");
                        callback(err);
                    }
                );
            },
            function (contact, callback) {
                logger.debug("PIFIX get_contact_session");
                streembit.PeerNet.get_contact_session(contact)
                .then(
                    function () {
                        logger.debug("PIFIX get_contact_session completed");
                        callback(null, contact);
                    },
                    function (err) {
                        logger.debug("PIFIX get_contact_session failed");
                        callback(err);
                    }
                );                
            },
            function (contact, callback) {
                // get the device info
                var message = { cmd: streembit.DEFS.PEERMSG_DEVDESC_REQ };
                streembit.PeerNet.send_peer_message(contact, message);
                connection_pending_account = contact.name;
            }
        ], 
        function (err) {
            if (err) {
                var msg = "Connecting to device error: ";
                msg += err.message ? err.message : err;
                return streembit.notify.error_popup(msg);
            }

        });  
    };

    return device;

}(streembit.Device || {}, streembit.logger, global.appevents, streembit.config));

