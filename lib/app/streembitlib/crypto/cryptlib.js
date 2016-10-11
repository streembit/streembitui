'use strict';

var EC = require('elliptic').ec;

function EccKey(curve) {
    this.curve = curve || 'secp256k1';

    var ec = new EC(this.curve);

    // Generate keys
    this.key = ec.genKeyPair();
}

Object.defineProperty(EccKey.prototype, 'publicKey', {
    get: function () {
        return this.key.getPublic();
    }
})

Object.defineProperty(EccKey.prototype, 'publicKeyHex', {
    get: function () {
        return this.key.getPublic('hex');
    }
})


module.exports = {
    EccKey: EccKey
}