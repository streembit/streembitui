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

var EC = require('elliptic').ec;
//FOR-BROWSER
var Buffer = require('jspm/nodelibs-buffer').Buffer;

var DEFAULT_CURVE = 'secp256k1';

var jwt = {};

jwt.decode = function decode(token, key) {
    // check token
    if (!token) {
        throw new Error('JWT decode error: no token supplied');
    }
    // check segments
    var segments = token.split('.');
    if (segments.length !== 3) {
        throw new Error('JWT decode error: invalid segment count');
    }
    
    // All segment should be base64
    var headerSeg = segments[0];
    var payloadSeg = segments[1];
    var signatureSeg = segments[2];
    
    // base64 decode and parse JSON
    var header = JSON.parse(base64urlDecode(headerSeg));
    var payload = JSON.parse(base64urlDecode(payloadSeg));
    
    if (!header.alg) {
        throw new Error('Invalid JWT header alg parameter');
    }
    
    if (header.alg != DEFAULT_CURVE) {
        throw new Error('JWT algorithm ' + header.alg + ' is not supported');
    }
    
    // verify signature. 
    var signbase64 = base64urlUnescape(signatureSeg);
    var signingInput = [headerSeg, payloadSeg].join('.');
    if (!verify(signingInput, key, signbase64)) {
        throw new Error('JWT signature verification failed');
    }
    
    return payload;
};


jwt.parse = function (token) {
    // check token
    if (!token) {
        throw new Error('JWT parse error: no token supplied');
    }
    // check segments
    var segments = token.split('.');
    if (segments.length !== 3) {
        throw new Error('JWT parse error: invalid segment count');
    }
    
    // All segment should be base64
    var headerSeg = segments[0];
    var payloadSeg = segments[1];
    var signatureSeg = segments[2];
    
    // base64 decode and parse JSON
    var header = JSON.parse(base64urlDecode(headerSeg));
    var payload = JSON.parse(base64urlDecode(payloadSeg));
    var signbase64 = base64urlUnescape(signatureSeg);
    
    return [header, payload, signbase64];
};


jwt.encode = function encode(payload, key, options) {
    // Check key
    if (!key) {
        throw new Error('JWT encode error: key parameter is missing');
    }
    
    var algorithm = DEFAULT_CURVE; 
    
    // header, typ is fixed value.
    var header = { typ: 'JWT', alg: algorithm };
    
    if (options.jti) {
        payload.jti = options.jti;
    }
    
    var timestamp = Math.floor(Date.now() / 1000);
    if (!options.noTimestamp) {
        payload.iat = payload.iat || timestamp;
    }
    
    if (options.expires) {
        if (typeof options.expires === 'number') { // must be in seconds
            payload.exp = timestamp + options.expires;
        }
        else {
            throw new Error('JWT encode error: expires must be a number of seconds');
        }
    }
    
    if (options.audience) {
        payload.aud = options.audience;
    }
    
    if (options.issuer) {
        payload.iss = options.issuer;
    }
    
    if (options.subject) {
        payload.sub = options.subject;
    }
    
    // create segments, all segments should be base64 string
    var segments = [];
    segments.push(base64urlEncode(JSON.stringify(header)));
    segments.push(base64urlEncode(JSON.stringify(payload)));
    
    var input = segments.join('.');
    var signature = sign(input, key);
    segments.push(signature);
    
    return segments.join('.');
};

jwt.get_message_payload = function (msg) {
    var segments = typeof msg === 'string' ? msg.split('.') : [];
    if (segments.length !== 3) {
        throw new Error('JWT decode error: invalid segment count');
    }
    
    // All segment should be base64
    var payloadSeg = segments[1];
    var payload = JSON.parse(base64urlDecode(payloadSeg));
    
    return payload;
}

jwt.base64decode = function (data) {
    if (!data || typeof data != "string")
        throw new Error("base64decode invalid parameter");
    
    var payload = JSON.parse(base64urlDecode(data));
    return payload;
}


function str2array(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return Array.prototype.slice.call(bufView);
}


function verify(input, public_key, signature) {
    var valid = false;
    try {

        var msg = null;
        // input must be an array
        if (typeof input == 'string') {
            msg = str2array(input);
        }
        else if (Array.isArray(input)) {
            msg = input;
        }
        else {
            throw new Error("Invalid sign input. Input must be array or string");
        }

        var sigbuffer = new Buffer(signature, 'base64');

        var ec = new EC(DEFAULT_CURVE);
        // Import public key
        var key = ec.keyFromPublic(public_key, 'hex');
        // Verify signature
        valid = key.verify(msg, sigbuffer);
    }
    catch (err) {
        throw new Error("JWT verify error: " + err.message)
    }
    
    return valid;
}


function sign(input, key) {
    var base64str;
    try {
        var msg = null; 
        // input must be an array
        if (typeof input == 'string') {
            msg = str2array(input);
        }
        else if (Array.isArray(input)) {
            msg = input;
        }
        else {
            throw new Error("Invalid sign input. Input must be array or string");
        }

        //console.log(msg);
        
        var ec = new EC(DEFAULT_CURVE);
        var signature = key.sign(msg);
        var sigarr = signature.toDER();
        //console.log(sigarr);
        var b64 = new Buffer(sigarr).toString('base64');
        //console.log(b64);
        base64str = base64urlEscape(b64);
        //console.log(base64str);
    }
    catch (err) {
        throw new Error("Error in JWT signing: " + err.message)
    }
    
    return base64str;
}

function base64urlDecode(str) {
    return new Buffer(base64urlUnescape(str), 'base64').toString();
}

function base64urlUnescape(str) {
    str += new Array(5 - str.length % 4).join('=');
    return str.replace(/\-/g, '+').replace(/_/g, '/');
}

function base64urlEncode(str) {
    return base64urlEscape(new Buffer(str).toString('base64'));
}

function base64urlEscape(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}


module.exports = jwt;