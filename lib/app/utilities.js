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

    var bs58check = require('bs58check');
    var createHash = require('create-hash');

    var utilities = {};

    utilities.format_bytes = function (bytes, decimals) {
        if (bytes == 0) return '0 Byte';
        var k = 1000;
        var dm = decimals + 1 || 3;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    utilities.timeNow = function () {
        var d = new Date(),
            h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
            m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        var value = h + ':' + m;
        return value;
    };

    utilities.bs58toHex = function (value) {
        var bs58buffer = bs58check.decode(value);
        var hex = bs58buffer.toString("hex");
        return hex;
    };

    utilities.keyToHexToRmd160ToBs58 = function (key) {
        var bs58buffer = bs58check.decode(key);
        var rmd160buffer = createHash('rmd160').update(bs58buffer).digest();
        var bs58pk = bs58check.encode(rmd160buffer);
        return bs58pk;
    };

    utilities.b64ToArrBuff = function (base64){
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    utilities.getrnditem = function (array) {
        if (Array.isArray(array)){
            var item = array[Math.floor(Math.random() * array.length)];
            return item;
        }
    }

    utilities.arrayBufferToHex = function (buffer){
        var data_view = new DataView(buffer);
        var iii, len, hex = '', c;

        for (iii = 0, len = data_view.byteLength; iii < len; iii += 1) {
            c = data_view.getUint8(iii).toString(16);
            if (c.length < 2) {
                c = '0' + c;
            }
            hex += c;
        }

        return hex;
    }

    Object.defineProperty(utilities, "ischrome", {
        get: function () {
            return !!navigator.webkitGetUserMedia;
        }
    });

    Object.defineProperty(utilities, "isfirefox ", {
        get: function () {
            return !!navigator.mozGetUserMedia;
        }
    });

    module.exports = utilities;

})();