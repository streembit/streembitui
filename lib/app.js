'use strict';

import Resources from './resources';

import Localization from './localization';

import uihandler from "./app/uihandler";

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import Components from './components';
import Binder from './bind';
import Router from './router';
import Config from './app/config';
import logger from './app/logger';
import Database from './app/database';
import Datadir from './app/datadir'

import i18next from 'i18next';

import AppEvents from "./app/streembitlib/events/AppEvents";

import elliptic from "elliptic";

import slib from "./app/streembitlib/libs";


import ecckey from "./app/streembitlib/crypto/cryptlib";

import secrand from 'secure-random';
import createHash from 'create-hash';

var App = {

    load: function() {
        debugger;

        var rndstr = secrand.randomBuffer(32).toString("hex");
        var entropy = createHash("sha256").update(rndstr).digest("hex");

        var key = ecckey();
        key.generateKey(entropy);
        console.log(key.publicKeyHex);
        var privkeyhex = key.privateKeyHex;

        var key2 = ecckey();
        key2.keyFromPrivate(privkeyhex);
        console.log(key2.publicKeyHex);

        //var EC = elliptic.ec;

        //// Create and initialize EC context
        //// (better do it once and reuse it)
        //var ec = new EC('secp256k1');

        //// Generate keys
        //var key = ec.genKeyPair();

        //var value = slib.message.create(key, "11223", {foo: 'barrrrrr'} );

        //var pk = key.getPublic('hex');
        //var msg = slib.message.decode(value, pk);

        //console.log(msg.data.foo == 'barrrrrr');

        //var cipher = slib.message.aes256encrypt("123456789", "some text");
        //var plain = slib.message.aes256decrypt("123456789", cipher);
        //console.log(plain == 'some text');

        //var rcptkey = ec.genKeyPair();
        //var ecdchiper = slib.message.ecdh_encypt(key, rcptkey.getPublic('hex'), { foo: 'bar2' });
        //var ecdhplain = slib.message.ecdh_decrypt(rcptkey, pk, ecdchiper);
        //var fooobj = JSON.parse(ecdhplain);
        //console.log(fooobj.foo == 'bar2');

        // Sign message (must be an array, or it'll be treated as a hex sequence)
        //var msg = 'some msg 111 222';
        //var narr = this.str2ab(msg);

        //var isarray = Array.isArray(narr);

        //var signature = key.sign(narr);

        //// Export DER encoded signature in Array
        //var derSign = signature.toDER();

        //var derHexSign = signature.toDER('hex');
        //console.log(derHexSign);

        //// Verify signature
        //console.log(key.verify(narr, derHexSign));

        //var EC = elliptic.ec;

        //// Create and initialize EC context
        //// (better do it once and reuse it)
        //var ec = new EC('secp256k1');

        uihandler.init(ko, $);

        Localization.load()
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-logger'));
                return logger.init(Config.appconfig.loglevel)
            })    
            .then(() => {
                logger.debug("Logger is initialized");
                uihandler.set_load_info(i18next.t('appload-application'));
                return AppSrvc.load()
            })   
            .then(() => {
                return Datadir.makedir();
            })   
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-database'));
                return Database.init();
            })       
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-components'));
                return Components.load()
            })            
            .then(() => {
                return Router.load()
            })
            .then(router => {
                return Binder.load(router, AppSrvc)
            })
            .then(() => {
                uihandler.on_load_complete();
                console.log('init chain is completed');

                AppEvents.emit(AppEvents.APP_INIT);
            })
            .catch(function (err) {
                logger.error("App load error. %j", err);
            });
        
    }
}

export default App;


