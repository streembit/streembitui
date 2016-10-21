'use strict';

var EC = require('elliptic').ec;

function EccKey(ecccurve) {
    if (!(this instanceof EccKey)) {
        return new EccKey(ecccurve)
    }

    this.curve = ecccurve || 'secp256k1';
    this.ecobj = new EC(this.curve);
}

EccKey.prototype.generateKey = function (entropy) {
    // Generate keys
    this.key = this.ecobj.genKeyPair({ entropy: entropy });
};

EccKey.prototype.keyFromPrivate = function (privkeyhex) {
    // Generate keys
    if (!privkeyhex || typeof privkeyhex != 'string') {
        throw new Error("Invalid private key hex at EccKey keyFromPrivate");
    }

    this.key = this.ecobj.keyFromPrivate(privkeyhex, 'hex');
};

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

Object.defineProperty(EccKey.prototype, 'privateKeyHex', {
    get: function () {
        return this.key.getPrivate('hex');
    }
})

Object.defineProperty(EccKey.prototype, 'privateKey', {
    get: function () {
        return this.key.getPrivate();
    }
})

module.exports = EccKey;