/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

var EC = require('elliptic').ec;
var aes = require("browserify-aes");
var Buffer = require('jspm/nodelibs-buffer').Buffer;

var DEFAULT_CURVE = 'secp256k1';

var jwe = (function () {
    var obj = {};   
    
    function create_symmetric_key(master_key, other_public_key) {
        var shared = master_key.derive(other_public_key);
        var symmkey = shared.toString(16);
        return symmkey;
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

    /*
        encoded_rcpt_pk: must be a hex encoded ECC public key
    */
    obj.encrypt = function (master_key, encoded_rcpt_pk, data) {        
        var rcpt_pk;
        try {
            var ec = new EC(DEFAULT_CURVE);
            rcpt_pk = ec.keyFromPublic(encoded_rcpt_pk, 'hex').getPublic();
        }
        catch (e) {
            throw new Error("ECDH encrypt error. Invalid public key, error: " + e.message);
        }

        var secret = create_symmetric_key(master_key, rcpt_pk);
        var cipher = aes.createCipher('aes256', secret);
        var cipher_text = cipher.update(data, 'utf8', 'base64');
        cipher_text += cipher.final('base64');
            
        //  Create a JWE structure by combining a JWE header and the cipher text
        //  Please note the A256KW in this implementation of WoT refers to the AES 256 algorithm and
        //  the key is not wrapped (as it is generated with Diffie-Hellman. The "KW" is kept to use a 
        //  standard value in the "enc" field.
        //  This implementation do not use a JWE Encrypted Key - the symmetric encryption key is a
        //  Diffie-Hellman key exchange secret. For increased security and fully comply with JWE standard
        //  future implementations could use a JWE Encrypted session key
        var header = { "alg": "ECDH-ES", "enc": "A256KW" };
        var segments = [];
        segments.push(base64urlEncode(JSON.stringify(header)));
        // the cipher is already Base64 encoded, only need to URL escape
        segments.push(base64urlEscape(cipher_text));
        var result = segments.join('.');
            
        return result;
    }
    
    /*
        encoded_rcpt_pk: must be a hex encoded ECC public key
    */
    obj.decrypt = function (master_key, encoded_rcpt_key, jwe_input) {
        //  Parse the JWE structure
        //  The input must include at least two Base64 encoded segments divided by a a "." as
        //  per the JWE standard definition
        var segments = jwe_input.split('.');
        if (segments.length !== 2) {
            throw new Error('JWE parse error: invalid segment count');
        }
        
        // All segment should be base64
        var headerSeg = segments[0];
        var cipherSeg = segments[1];
        
        // base64 decode and parse JSON
        var header = JSON.parse(base64urlDecode(headerSeg));
        //  The payload was only URL escaped, see above the encryption method, need to URL unescape it
        var cipher_text = base64urlUnescape(cipherSeg);
        
        if (!header || !header.alg) {
            throw new Error('JWE parse error: invalid header alg field');
        }
        
        if (header.alg.indexOf("ECDH") > -1) {
            var rcpt_pk;
            try {
                var ec = new EC(DEFAULT_CURVE);
                rcpt_pk = ec.keyFromPublic(encoded_rcpt_key, 'hex').getPublic();
            }
            catch (e) {
                throw new Error("ECDH encrypt error. Invalid public key, error: " + e.message);
            }

            var secret = create_symmetric_key(master_key, rcpt_pk);
            var decipher = aes.createDecipher('aes256', secret);
            var plain_text = decipher.update(cipher_text, 'base64', 'utf8');
            plain_text += decipher.final();
            
            return plain_text;
        }
        else {
            //  TODO implement here the support for RSA
            throw new Error("Invalid crypto alg. Only ECDH is supported on this version of WOT");
        }
    }
    
    obj.decrypt_ecdh = function (master_key, sender_public_key, jwe_input) {
        var public_key = ec.keyFromPublic(sender_public_key, 'hex');
        return obj.decrypt(master_key, public_key, jwe_input);
    }
    
    obj.aes256decrypt = function (symmetric_key, cipher_text) {
        var decipher = aes.createDecipher('aes256', symmetric_key);
        var plain_text = decipher.update(cipher_text, 'base64', 'utf8');
        plain_text += decipher.final();
        
        return plain_text;
    }
    
    obj.aes256encrypt = function (symmetric_key, data) {
        var cipher = aes.createCipher('aes256', symmetric_key);
        var cipher_text = cipher.update(data, 'utf8', 'base64');
        cipher_text += cipher.final('base64');
        
        return cipher_text;
    }
    
    
    obj.symm_decrypt = function (symmetric_key, jwe_input) {
        //  Parse the JWE structure
        //  The input must include at least two Base64 encoded segments divided by a a "." as
        //  per the JWE standard definition
        var segments = jwe_input.split('.');
        if (segments.length !== 2) {
            throw new Error('JWE parse error: invalid segment count');
        }
        
        // All segment should be base64
        var headerSeg = segments[0];
        var cipherSeg = segments[1];
        
        // base64 decode and parse JSON
        var header = JSON.parse(base64urlDecode(headerSeg));
        //  The payload was only URL escaped, see above the encryption method, need to URL unescape it
        var cipher_text = base64urlUnescape(cipherSeg);
        
        if (!header || !header.enc) {
            throw new Error('JWE parse error: invalid header enc field');
        }
        
        if (header.enc.indexOf("A256KW") > -1) {
            var decipher = aes.createDecipher('aes256', symmetric_key);
            var plain_text = decipher.update(cipher_text, 'base64', 'utf8');
            plain_text += decipher.final();
            
            return plain_text;
        }
        else {
            //  TODO implement here the support for RSA
            throw new Error("Invalid crypto enc. Only A256KW is supported oin this version of the application");
        }
    }
    
    obj.symm_encrypt = function (symmetric_key, data) {
        
        var cipher = aes.createCipher('aes256', symmetric_key);
        var cipher_text = cipher.update(data, 'utf8', 'base64');
        cipher_text += cipher.final('base64');
        
        var header = { "enc": "A256KW" };
        var segments = [];
        segments.push(base64urlEncode(JSON.stringify(header)));
        // the cipher is already Base64 encoded, only need to URL escape
        segments.push(base64urlEscape(cipher_text));
        var result = segments.join('.');
        
        return result;
    }    
    
    return obj;
}());


module.exports = jwe;