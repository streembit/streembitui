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

Peer to peer implementation of the Streembit network

*/

'use strict';

import async from 'async';
import Network from "./network";
import { kad, upnp, discovery } from "./peerutils";
import logger from './logger';
import config from './config';
import Seeds from './seeds';

const DEFAULT_TCP_PORT = 8905;

class PeerToPeerNet extends Network {
    constructor() {
        super();
        this.bootseeds = null;
        this.node = null;
        this.address = null;
        this.port = config.appconfig.tcpport || DEFAULT_TCP_PORT;
    }

    init() {
        return new Promise((resolve, reject) => {
            logger.debug("Initializing peer Streembit client");

            var self = this;

            var bootseeds;

            async.waterfall([
                function (callback) {
                    this.setUpnpPort(callback);
                },
                function (callback) {
                    Seeds.load(callback);
                },
                function (seeds, callback) {
                    if (!seeds || !Array.isArray(seeds) || !seeds.length) {
                        return callback("Error in populating the seed list. Please make sure the 'bootseeds' configuration is correct and a firewall doesn't block the Streembit software!");
                    }
                    self.bootseeds = seeds;
                    discovery(seeds, function (err, ipaddress) {
                        if (err) {
                            return callback(err);
                        }
                        this.address = ipaddress;
                        callback();
                    });
                },                
                function (callback) {
                    initNetwork(callback);
                },
                function (callback) {
                    this.validateContacts(function (err, contcount) {
                        if (err) {
                            callback("The peer is not connected. Error: " + err);
                        }
                        else if (!contcount) {
                            callback("The peer is not connected, not communicating with any contacts.");
                        }
                        else {
                            logger.debug("Number of connected peers: " + contcount);
                            callback();
                        }
                    });                    
                }
            ],
            function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });            
        });
    }

    initNetwork(callback) {
        try {
            var self = this;

            if (!this.bootseeds || !this.bootseeds.length) {
                return callback("Invalid seeds");
            }

            if (this.node && this.connected == true) {
                this.node.disconnect(function () {
                    this.is_connected = false;
                    this.node = null;
                    self.init(bootdata, callback);
                });
            }
            else {
                var seedlist = [];

                for (var i = 0; i < this.bootseeds.length; i++) {
                    seedlist.push(this.bootseeds[i]);
                    logger.debug("seed: %j", this.bootseeds[i]);
                }

                assert(this.address, "address must be passed to node initialization");
                assert(this.port, "port must be passed to node initialization");
                assert(bootdata.public_key, "account public key must be initialized");
                assert(bootdata.account, "account name  key must be initialized");

                var param = {
                    address: bootdata.address,
                    port: bootdata.port,
                    account: bootdata.account,
                    public_key: bootdata.public_key
                };

                var contact = kad.contacts.StreembitContact(param);

                var transport_options = {
                    logger: logger
                };
                var transport = kad.transports.TCP(contact, transport_options);

                transport.after('open', function (next) {
                    // exit middleware stack if contact is blacklisted
                    logger.info('TCP peer connection is opened');

                    // otherwise pass on
                    next();
                });

                // message validator
                transport.before('receive', onKadMessage);

                // handle errors from RPC
                transport.on('error', onTransportError);

                var options = {
                    transport: transport,
                    logger: logger,
                    storage: db,
                    seeds: seedlist,
                    onPeerMessage: onPeerMessage,
                    expireHandler: expireHandler,
                    findRangeMessages: findRangeMessages
                };

                kad.create(options, function (err, peer) {
                    if (err) {
                        streembit.User.address = "";
                        streembit.User.port = 0;
                        return resultfn(err);
                    }

                    logger.debug("peernode.create complete");

                    streembit.User.port = bootdata.port;
                    streembit.User.address = bootdata.address;

                    peerobj.is_connected = true;
                    peerobj.node = peer;

                    resultfn();
                });
            }
        }
        catch (e) {
            resultfn(e);
        }
    }

    setUpnpPort(callback) {
        try {
            var client = upnp.createClient(logger);
            var port = config.appconfig.tcpport;
            client.portMapping(
                {
                    public: port,
                    private: port,
                    ttl: 0,  //  not renew, keep opened
                    description: "Streembit UPNP" 
                },
                function (err) {
                    if (err) {
                        logger.error("UPNP portMapping error: %j", err);
                    }
                    // still return even if there is an error as the port forwarding could have been set up manually
                    callback();
                }
            );
        }
        catch (e) {
            logger.error("UPNP portMapping exception: %j", e);
            callback(e);
        }
    }    

    validateContacts(callback) {
        try {
            kad.validate_contacts(this.node, callback);
        }
        catch (e) {
            callback(e);
        }
    }
}

export default PeerToPeerNet;