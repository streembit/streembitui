'use strict';

var EC = require('elliptic').ec;
var bs58check = require('bs58check');
var createHash = require('create-hash');
var Buffer = require('jspm/nodelibs-buffer').Buffer;

function EccKey(ecccurve) {
    if (!(this instanceof EccKey)) {
        return new EccKey(ecccurve)
    }

    this.key = 0;
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

EccKey.prototype.BS58PkToHex = function (bsd8pk) {
    try {
        var buffer = bs58check.decode(bsd8pk);
        var hex = buffer.toString("hex");
        return hex;
    }
    catch (err) {
        return null;
    }
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

Object.defineProperty(EccKey.prototype, 'pubkeyhash', {
    get: function () {
        var rmd160buffer = this.publicKeyrmd160;
        var bs58pk = bs58check.encode(rmd160buffer);
        return bs58pk;
    }
})

Object.defineProperty(EccKey.prototype, 'publicKeyrmd160', {
    get: function () {
        var pkhex = this.key.getPublic('hex');
        var buffer = new Buffer(pkhex, 'hex');
        var rmd160buffer = createHash('rmd160').update(buffer).digest();
        return rmd160buffer;
    }
})

Object.defineProperty(EccKey.prototype, 'publicKeyBs58', {
    get: function () {
        var pkhex = this.key.getPublic('hex');
        var buffer = new Buffer(pkhex, 'hex');
        var bs58hash = bs58check.encode(buffer);
        return bs58hash;
    }
})

Object.defineProperty(EccKey.prototype, 'privateKey', {
    get: function () {
        return this.key.getPrivate();
    }
})

Object.defineProperty(EccKey.prototype, 'cryptoKey', {
    get: function () {
        return this.key;
    }
})

module.exports = EccKey;