/*
 
This file is part of W3C Web-of-Things-Framework.

W3C Web-of-Things-Framework is an open source project to create an Internet of Things framework.
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by 
the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

W3C Web-of-Things-Framework is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  If not, see <http://www.gnu.org/licenses/>.
 
File created by Tibor Zsolt Pardi

Copyright (C) 2015 The W3C WoT Team
 
*/

var util = require('util');
var assert = require('assert');
var crypto = require(global.cryptolib);
var jwt = require('./jwt');
var jwe = require('./jwe').handler;


var MSGTYPE = {
    PUBPK: 0x01,    //  Add public key to the network. Must perform this when the node joins first time to the P2P network    
    DELPK: 0x02,    //  Remove the existing public key from the network
    DATA: 0x03,     //  Publish data to the network
    OMSG: 0x04,     //  Off-line message
    UPDPK: 0x05,    //  Update public key
    DEL: 0x06       //  Delete public key message
};

var MSGFIELD = {
    NODEID: "node_id",
    PUBKEY: "public_key",
    LASTPKEY: "last_pkey",
    CURRPK: "curr_pkey",
    CURRSIG: "curr_pkey_sig",
    ECDHPK: "ecdh_public",
    PROTOCOL: "protocol",
    HOST: "address",
    PORT: "port",
    DATA: "data",
    CIPHER: "cipher",
    ACCOUNT: "account",
    REQJTI: "request_jti",
    UTYPE: "user_type",
    TIMES: "timestamp",
    CALLT: "call_type",
    RESULT: "result",
    SEKEY: "send_ecdh_public",
    REKEY: "rcpt_ecdh_public"
};

var PEERMSG = {
    DHOP: 0xDAD,    //  DHOP = Diffie Hellman Operation, DH encrypted message. Use it only for encrypting the session symmetric key
    EXCH: 0xDAE,    //  Key exchange operation, the peer sends its DH public key part to the other peer
    SYMD: 0xDAF,    //  Data encrypted with the exchanged symmetric key
    PING: 0xDB0,    //  Ping request
    PREP: 0xDB1,    //  Ping reply
    ACCK: 0xDB2,    //  Accept session symmetric key
    CALL: 0xDB3,    //  Video call
    CREP: 0xDB4,    //  Reply to video call
    DEL: 0xDB5,     //  Delete message
    FILE: 0xDB6,    //  File transfer init
    FREP: 0xDB7,    //  Reply file transfer init
    HCAL: 0xDB8     //  Close call
};


function serialize(input) {
    var text = null;
    try {
        if (typeof input != 'string') {
            if (typeof input == 'object') {
                try {
                    text = JSON.stringify(input);
                }
                catch (e) {
                    text = input.toString();
                }
            }
            else {
                text = input.toString();
            }
        }
        else {
            text = input;
        }
    }
    catch (err) {
        throw new Error("Error in serializing payload, error: %j", err, {});
    }
    
    if (!text)
        throw new Error("Error in serializing payload");
    
    return text;
}


function decode(payload, public_key) {
    if (!public_key) {
        throw new Error("WoTMessage decode error: public_key parameter is missing");
    }
    
    if (!payload) {
        throw new Error("WoTMessage decode error: payload parameter is missing");
    }
    
    var message = jwt.decode(payload, public_key);
    
    return message;
}

function create (private_key, jti, payload, algorithm, expires, issuer, subject, audience) {    
    if (!private_key) {
        throw new Error("WoTMessage private_key parameter is missing");
    }
    
    if (!payload) {
        throw new Error("WoTMessage payload parameter is missing");
    }
    
    if (!jti) {
        throw new Error("WoTMessage jti parameter is missing");
    }
    
    var input = {};

    // create a data field for the actual data if not exists
    if (payload.hasOwnProperty('data') == false) {
        input.data = payload;
    }
    else {
        input = payload;
    }

    var options = {};

    options.algorithm = algorithm || 'ES256';

    // currently only ECC is supported    
    assert(options.algorithm == "ES256" || options.algorithm == "ES384" || options.algorithm == "ES512", "In this version only elliptic curve cryptography algorithms supported");
    
    options.jti = jti;

    if (expires) {
        options.expires = expires;
    }
    
    if (issuer) {
        options.issuer = issuer;
    }
    
    if (subject) {
        options.subject = subject;
    }
    
    if (audience) {
        options.audience = audience;
    }
    
    // create a json web token
    var token = jwt.encode(input, private_key, options);
    
    return token;    
}


function get_msg_array (buffer) {
    if (!buffer || typeof buffer != "string") {
        throw new Error("get_msg_array error: invalid buffer");
    }
    
    var elements = jwt.parse(buffer);
    return elements;
}

function get_message_payload (msg) {
    var payload = jwt.get_message_payload(msg);
    return payload;
}


function base64decode(data) {
    return jwt.base64decode(data);
}

function ecdh_encypt(ECDH_key, ECDH_public, data) {
    if (!ECDH_key) {
        throw new Error("WoTMessage ecdh_encypt ECDH key parameter is missing");
    }
    if (!ECDH_public) {
        throw new Error("WoTMessage ecdh_encypt ECDH public key parameter is missing");
    }
    if (!data) {
        throw new Error("WoTMessage ecdh_encypt payload parameter is missing");
    }
    
    var datastr = serialize(data);
    var cipher_text = jwe.encrypt(jwe.CRYPTOSYS.ECC, ECDH_key, ECDH_public, datastr);

    return cipher_text;
}

function ecdh_decrypt(ECDH_key, ECDH_public, data) {
    if (!ECDH_key) {
        throw new Error("WoTMessage ecdh_decrypt ECDH key parameter is missing");
    }
    if (!ECDH_public) {
        throw new Error("WoTMessage ecdh_decrypt ECDH public key parameter is missing");
    }
    if (!data) {
        throw new Error("WoTMessage ecdh_decrypt payload parameter is missing");
    }
    
    var plain_text = jwe.decrypt(ECDH_key, ECDH_public, data);    
    return plain_text;
}


function create_msg (msgtype, jti, ECC_private_key, payload, issuer, audience, expires, algorithm) {
    if (!msgtype) {
        throw new Error("WoTMessage create_msg error: msgtype parameter is missing");
    }
    if (!ECC_private_key) {
        throw new Error("WoTMessage create_msg error: private_key parameter is missing");
    }
    if (!payload) {
        throw new Error("WoTMessage create_msg error: payload parameter is missing");
    }
    
    var datastr = serialize(payload);
    var data = { data: datastr }
    
    // create a JSON Web Token (JWT)
    var token = create(ECC_private_key, jti, data, algorithm, expires, issuer, msgtype, audience);
    assert(token && (typeof token == 'string'), "Invalid JWT token, token must be string");
    
    return token;
}


function create_symm_msg (msgtype, jti, ECC_private_key, session_symmetric_key, payload, issuer, audience, expires, algorithm) {
    if (!ECC_private_key) {
        throw new Error("WoTMessage create_symm_peermsg private_key parameter is missing");
    }
    if (!session_symmetric_key) {
        throw new Error("WoTMessage create_symm_peermsg symmetric key parameter is missing");
    }
    if (!payload) {
        throw new Error("WoTMessage create_symm_peermsg payload parameter is missing");
    }
    
    var datastr = serialize(payload);
    
    // get JSON Web Encryption (JWE) encrypted structure
    var cipher_text = jwe.symm_encrypt(session_symmetric_key, datastr);
    var data = { data: cipher_text }
    
    // create a JSON Web Token (JWT)
    var token = create(ECC_private_key, jti, data, algorithm, expires, issuer, msgtype, audience);
    assert(token && (typeof token == 'string'), "Invalid JWT token, token must be string");
   
    return token;
}

function decrypt(symmetric_key, payload) {
    if (!symmetric_key) {
        throw new Error("WoTMessage decrypt symmetric_key parameter is missing");
    }
    if (!payload) {
        throw new Error("WoTMessage create_symm_peermsg payload parameter is missing");
    }

    var plain_text = jwe.symm_decrypt(symmetric_key, payload);
    return plain_text;
}


function aes256decrypt (symmetric_key, cipher_text) {
    return jwe.aes256decrypt(symmetric_key, cipher_text);
}

function aes256encrypt(symmetric_key, data) {
    return jwe.aes256encrypt(symmetric_key, data);
}

function decrypt_ecdh(rcpt_private_key, rcpt_public_key, sender_public_key, jwe_input) {
    return jwe.decrypt_ecdh(rcpt_private_key, rcpt_public_key, sender_public_key, jwe_input);
}


module.exports = {
    getpayload: get_message_payload,
    decode: decode,
    base64decode: base64decode,
    create: create,
    create_msg: create_msg,
    create_symm_msg: create_symm_msg,
    get_msg_array: get_msg_array,
    ecdh_encypt: ecdh_encypt,
    ecdh_decrypt: ecdh_decrypt,
    decrypt: decrypt,
    MSGTYPE:  MSGTYPE,
    MSGFIELD: MSGFIELD,
    PEERMSG: PEERMSG,
    decrypt_ecdh: decrypt_ecdh,
    aes256encrypt: aes256encrypt,
    aes256decrypt: aes256decrypt
}

