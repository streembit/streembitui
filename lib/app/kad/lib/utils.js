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

/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thanks to Gordon Hall https://github.com/gordonwritescode the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */
/**
* @module kad/utils
*/

'use strict';

var assert = require('assert');
var crypto = nwrequire('crypto');
var constants = require('./constants');

/**
 * Validate a key
 * @param {String} key - Key to test
 * @returns {Boolean}
 */
exports.isValidKey = function (key) {
    return !!key && key.length === constants.B / 4;
};

/**
 * Create a valid ID from the given string
 * @param {String|Buffer} data - Data to SHA1 hash
 * @returns {String}
 */
exports.createID = function (data) {
    if (exports.isValidKey(data)) {
        return data;
    }

    return crypto.createHash('sha1').update(data).digest('hex');
};

/**
 * Convert a key to a buffer
 * @param {String} hexString
 * @returns {Buffer}
 */
exports.hexToBuffer = function (hexString) {
    var buf = new Buffer(constants.B / 8);
    buf.write(hexString, 0, 'hex');
    return buf;
};

/**
 * Calculate the distance between two keys
 * @param {String} key1
 * @param {String} key2
 * @returns {Number}
 */
exports.getDistance = function (id1, id2) {
    assert(exports.isValidKey(id1), 'Invalid key supplied');
    assert(exports.isValidKey(id2), 'Invalid key supplied');

    var distance = new Buffer(constants.B / 8);
    var id1Buf = exports.hexToBuffer(id1);
    var id2Buf = exports.hexToBuffer(id2);

    for (var i = 0; i < constants.B / 8; ++i) {
        distance[i] = id1Buf[i] ^ id2Buf[i];
    }

    return distance;
};

/**
 * Compare two buffers for sorting
 * @param {Buffer} b1
 * @param {Buffer} b2
 * @returns {Number}
 */
exports.compareKeys = function (b1, b2) {
    assert.equal(b1.length, b2.length);

    for (var i = 0; i < b1.length; ++i) {
        if (b1[i] !== b2[i]) {
            if (b1[i] < b2[i]) {
                return -1;
            } else {
                return 1;
            }
        }
    }

    return 0;
};

/**
 * Calculate the index of the bucket that key would belong to
 * @param {String} id1
 * @param {String} id2
 * @returns {Number}
 */
exports.getBucketIndex = function (id1, id2) {
    assert(exports.isValidKey(id1), 'Invalid key supplied');
    assert(exports.isValidKey(id2), 'Invalid key supplied');

    var distance = exports.getDistance(id1, id2);
    var bucketNum = constants.B;

    for (var i = 0; i < distance.length; i++) {
        if (distance[i] === 0) {
            bucketNum -= 8;
            continue;
        }

        for (var j = 0; j < 8; j++) {
            if (distance[i] & (0x80 >> j)) {
                return --bucketNum;
            } else {
                bucketNum--;
            }
        }
    }

    return bucketNum;
};

/**
 * @private
 * @param {Number} exp
 * @returns {Buffer}
 */
exports.getPowerOfTwoBuffer = function (exp) {
    assert.ok(exp >= 0 && exp < constants.B);

    var buffer = new Buffer(constants.K);
    var byte = parseInt(exp / 8);

    // we set the byte containing the bit to the right left shifted amount
    buffer.fill(0);
    buffer[constants.K - byte - 1] = 1 << (exp % 8);

    return buffer;
};

/**
 * Assuming index corresponds to power of 2
 * (index = n has nodes within distance 2^n <= distance < 2^(n+1))
 * @param {Number} index
 */
exports.getRandomInBucketRangeBuffer = function (index) {
    var base = exports.getPowerOfTwoBuffer(index);
    var byte = parseInt(index / 8); // randomize bytes below the power of two

    for (var i = constants.K - 1; i > (constants.K - byte - 1); i--) {
        base[i] = parseInt(Math.random() * 256);
    }

    // also randomize the bits below the number in that byte
    // and remember arrays are off by 1
    for (var j = index - 1; j >= byte * 8; j--) {
        var one = Math.random() >= 0.5;
        var shiftAmount = j - byte * 8;

        base[constants.K - byte - 1] |= one ? (1 << shiftAmount) : 0;
    }

    return base;
};