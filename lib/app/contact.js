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

var streembitnet = require('./streembitnet');
var bs58check = require('bs58check');
var createHash = require('create-hash');
var appsrvc = require('appsrvc');
var peermsg = require('peermsg');
var Buffer = require('jspm/nodelibs-buffer').Buffer;

function Contact(contact) {

    var handler = {};

    this.contact = contact;

    this.get_contact_transport = function () {
        return streembitnet.get_transport(this.contact.protocol, this.contact.address, this.contact.port);
    };

    this.get_contact_offer = function (transport, param) {
        return new Promise(function (resolve, reject) {
            if (!param) {
                callback("getcontact offer error: invalid contact parameter");
            }

            var account = param.name;            

            var key = param.pkeyhash + "/" + appsrvc.pubkeyhash;

            transport.get(key, function (err, result) {
                try {
                    if (err) {
                        return reject(err);
                    }

                    if (!result) {
                        return reject("contact offer does not exists for " + account);
                    }

                    // the WS peer sends back a payload.value object, validate and handle that
                    var msg;
                    if (result.value && typeof result.value == "string" ) {
                        msg = result.value;
                    }
                    else {
                        msg = result;
                    }

                    // parse the message
                    var payload = peermsg.getpayload(msg);
                    if (!payload || !payload.data || !payload.data.type || payload.data.type != peermsg.MSGTYPE.CAMSG) {
                        return reject("get_contact_offer error: invalid contact payload");
                    }

                    var isspkey = payload.iss;
                    if (isspkey != param.public_key) {
                        return reject("get contact offer error: public key mismatch with contact: " + account + ", new contact request is required");
                    }

                    var decoded = peermsg.decode(msg, param.publickeyhex);
                    if (!decoded || !decoded.data.cipher) {
                        return reject("get_contact_offer error: invalid decoded contact payload");
                    }

                    var cipher = decoded.data.cipher;
                    var plaintext = peermsg.ecdh_decrypt(appsrvc.cryptokey, param.publickeyhex, cipher);
                    var connection = JSON.parse(plaintext);
                    if (!connection) {
                        return reject("get_contact_offer error: no connection details field is published from contact " + account);
                    }

                    if (connection.account != account) {
                        return reject("get_contact_offer error: account mismatch was published from contact " + account);
                    }

                    var address = connection[peermsg.MSGFIELD.HOST];
                    if (!address) {
                        return reject("get_contact_offer error: no address field is published from contact " + account);
                    }

                    var port = connection[peermsg.MSGFIELD.PORT];
                    if (!port) {
                        return reject("get_contact_offer error: no port field is published from contact " + account);
                    }

                    var protocol = connection[peermsg.MSGFIELD.PROTOCOL];
                    if (!protocol) {
                        return reject("get_contact_offer error: no protocol field is published from contact " + account);
                    }

                    var connsymmkey = connection[peermsg.MSGFIELD.SYMKEY];
                    if (!connsymmkey) {
                        return reject("get_contact_offer error: no connsymmkey field is published from contact " + account);
                    }

                    var pkey = connection.public_key;
                    if (!pkey || pkey != isspkey) {
                        return reject("get_contact_offer error: public key mismatch for contact " + account);
                    }

                    var utype = connection[peermsg.MSGFIELD.UTYPE];

                    var contact = {
                        public_key: pkey,
                        address: address,
                        port: port,
                        name: account,
                        user_type: utype,
                        protocol: protocol,
                        pkeyhash: param.pkeyhash,
                        publickeyhex: param.publickeyhex,
                        connkey: connsymmkey
                    };

                    resolve(contact);

                    //               
                }
                catch (e) {
                    reject(e.message);
                }
            })
        });
    };

    this.get_contact_details = function (transport, param) {
        return new Promise(function (resolve, reject) {
            try {

                if (!param) {
                    callback("getcontact details error: invalid contact parameter");
                }

                var account = param.name;
                var key = param.pkeyhash;

                transport.get(key, function (err, msg) {
                    try {
                        if (err) {
                            return reject(err);
                        }

                        if (!msg) {
                            return reject("contact details does not exists for " + account);
                        }

                        // parse the message
                        var payload = peermsg.getpayload(msg);
                        if (!payload || !payload.data || !payload.data.type) {
                            return reject("get_contact_details error: invalid contact payload");
                        }

                        var isspkey = payload.iss;
                        if (isspkey != param.public_key) {
                            return reject("get_contact_details offer error: public key mismatch with contact: " + account + ", new contact request is required");
                        }

                        var decoded = peermsg.decode(msg, param.publickeyhex);
                        if (!decoded || !decoded.data.cipher) {
                            return reject("get_contact_details error: invalid decoded contact payload");
                        }

                        var cipher = decoded.data.cipher;
                        var plaintext = peermsg.aes256decrypt(param.connkey, cipher);
                        var connection = JSON.parse(plaintext);
                        if (!connection) {
                            return reject("get_contact_details error: no connection details field is published from contact " + account);
                        }

                        if (connection.account != account) {
                            return reject("get_contact_details error: account mismatch was published from contact " + account);
                        }

                        var address = connection[peermsg.MSGFIELD.HOST];
                        if (!address) {
                            return reject("get_contact_details error: no address field is published from contact " + account);
                        }

                        var port = connection[peermsg.MSGFIELD.PORT];
                        if (!port) {
                            return reject("get_contact_details error: no port field is published from contact " + account);
                        }

                        var protocol = connection[peermsg.MSGFIELD.PROTOCOL];
                        if (!protocol) {
                            return reject("get_contact_details error: no protocol field is published from contact " + account);
                        }

                        var pkey = connection.public_key;
                        if (!pkey || pkey != isspkey) {
                            return reject("get_contact_details error: public key mismatch for contact " + account);
                        }

                        var utype = connection[peermsg.MSGFIELD.UTYPE];

                        var contact = {
                            public_key: pkey,
                            address: address,
                            port: port,
                            name: account,
                            user_type: utype,
                            protocol: protocol,
                            pkeyhash: param.pkeyhash,
                            publickeyhex: param.publickeyhex,
                            connkey: param.connkey
                        };

                        resolve(contact);

                        //               
                    }
                    catch (e) {
                        reject(e.message);
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    };

    this.find = function (completefn) {
        try {
            var transport = this.get_contact_transport();
            if (!transport) {
                throw new Error("find contact error, failed to create network object")
            }

            var self = this;

            this.get_contact_offer(transport, this.contact)
            .then(
                function (contact) {
                    completefn(null, contact);
                }
            )
            .catch(function (err) {
                completefn(err);
            });
        }
        catch (err) {
            completefn(err);
        }
    };

}


module.exports = Contact;