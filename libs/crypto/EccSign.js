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

This cryptography implementation is forked from the crypto libraries of http://cryptocoinjs.com/ 

*/

var crypto = require('crypto');
var ecdsa = require('./EccDsa');

function EccSign(privateKey, input) {
    if (!privateKey || input == undefined) {
        throw new Error("Invalid EccSign parameters");
        return;
    }
    
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
        throw new Error("Invalid EccSign input parameter");
    }
    
    if (!text) {
        throw new Error("Invalid EccSign input parameter");
    }

    var buffer = new Buffer(text, "utf-8");
    var hash = crypto.createHash('sha256').update(buffer).digest();

    var signbuffer = ecdsa.sign(hash, privateKey);
    var ser1 = ecdsa.serializeSig(signbuffer);
    var ser2 = new Buffer(ser1);

    var signatureb64 = ser2.toString('base64');

    return signatureb64;
}

module.exports = EccSign;

