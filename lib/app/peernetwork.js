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
import ecckey from "./libs/crypto/cryptlib";
import secrand from 'secure-random';
import createHash from 'create-hash';
import slib from "./libs/index";
import database from './database';
import auth from './auth';
import appevents from "./libs/events/AppEvents";
//import peer from './peer';
import user from './user';
import appsrvc from './appsrvc';

const DEFAULT_TCP_PORT = 8905;

class PeerToPeerNet extends Network {
    constructor() {
        super();
        this.bootseeds = null;
        this.address = null;
        this.port = config.appconfig.tcpport || DEFAULT_TCP_PORT;
        this.account = null;
        this.public_key = null;
        this.node = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                logger.debug("Initializing peer Streembit client");

                var self = this;

                async.waterfall([
                    function (callback) {
                        self.disconnect(callback);
                    },
                    function (callback) {
                        self.setUpnpPort(callback);
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
                            self.address = ipaddress;
                            callback();
                        });
                    },
                    function (callback) {
                        self.initNetwork(callback);
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
            }
            catch (e) {
                reject(e);
            }
        });            
    }

    disconnect(callback) {
        var self = this;

        this.connected = false;
        this.node = null;
        appsrvc.node = null;
        appsrvc.address = null;
        appsrvc.port = null;
        appsrvc.net_connected = false;

        if (appsrvc.node && this.connected == true) {
            appsrvc.node.disconnect(function () {                
                callback();
            });
        }
        else {
            callback();
        }
    }

    onTransportError(err) {
        logger.error('KAD RPC error: %j', err);
    }

    msg_stored(node_id, item) {
        if (!item || !item.key || !item.hash || !item.value) { return }

        var msgkey = user.name + "/message/";
        if (key.indexOf(msgkey) > -1 && item.recipient == user.name) {
            // create an array
            var items = [item];
            appevents.emit(appevents.APPEVENT, appevents.TYPES.ONACCOUNTMSG, items);
        }
    }    

    setUpnpPort(callback) {
        try {
            var client = upnp.createClient(logger);
            var port = this.port;
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

                    appsrvc.upnpgateway = client.upnp_gateway;
                    appsrvc.upnpaddress = client.upnp_local_address;

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

    getseeds() {
        var seeds = [];
        if (!this.node) {
            return seeds;
        }

        var buckets = this.node._router._buckets;
        if (buckets) {
            for (var prop in buckets) {
                var bucket = buckets[prop];
                if (bucket._contacts) {
                    for (var i = 0; i < bucket._contacts.length; i++) {
                        seeds.push(bucket._contacts[i]);
                    }
                }
            }
        }

        return seeds;
    }    

    initNetwork(callback) {
        try {
            var self = this;

            if (!this.bootseeds || !this.bootseeds.length) {
                return callback("Invalid seeds");
            }

            var seedlist = [];

            for (var i = 0; i < this.bootseeds.length; i++) {
                seedlist.push(this.bootseeds[i]);
                logger.debug("seed: %j", this.bootseeds[i]);
            }

            var rndstr = secrand.randomBuffer(32).toString("hex");
            this.account = createHash("sha1").update(rndstr).digest("hex");
            if (!this.account) {
                throw new Error("account name  key must be initialized");
            }

            var entropy = createHash("sha256").update(rndstr).digest("hex");

            // create ECC key
            var key = new ecckey();
            key.generateKey(entropy);

            this.public_key = key.publicKeyHex;
            if (!this.public_key) {
                throw new Error("account public key must be initialized");
            }

            if (!this.address) {
                throw new Error("address must be passed to node initialization");
            }

            if (!this.port) {
                throw new Error("port must be passed to node initialization");
            }

            var param = {
                address: this.address,
                port: this.port,
                account: this.account,
                public_key: this.public_key
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
            transport.before('receive', auth.onKadMessage);

            // handle errors from RPC
            transport.on('error', this.onTransportError);

            var db = database.getkaddb();

            var options = {
                transport: transport,
                logger: logger,
                storage: db,
                seeds: seedlist,
                onPeerMessage: this.onPeerMessage,
                expireHandler: auth.expireHandler,
                findRangeMessages: auth.findRangeMessages
            };

            kad.create(options, function (err, peerobj) {
                if (err) {
                    return callback(err);
                }

                logger.debug("kad.create complete");

                self.isconnected = true;
                self.node = peerobj;
                appsrvc.node = peerobj;
                appsrvc.address = param.address;
                appsrvc.port = param.port;
                appsrvc.transport = "tcp";
                appsrvc.net_connected = true;

                console.log("Peer node has been initialized");

                callback();
            });

        }
        catch (e) {
            callback(e);
        }
    }
}

export default PeerToPeerNet;