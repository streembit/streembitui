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

    define(
        ['i18next', 'appsrvc', 'appevents', 'apputils', 'uihandler', 'definitions', 'settings', 'user', 'peermsg' , 'accounts', './netinfo.html!text'],
        function (i18next, appsrvc, appevents, apputils, uihandler, definitions, settings, user, peermsg, accounts, template) {

            function NetInfoVm(params) {
                var viewModel = {
                    sessionid: ko.observable(appsrvc.sessionid),
                    useraccount: ko.observable(appsrvc.username),
                    public_key: ko.observable(appsrvc.publickeyhex),
                    bs58_public_key: ko.observable(appsrvc.publicKeyBs58),
                    publickey_rmd160_hash: ko.observable(appsrvc.pubkeyrmd160hash),
                    pubkeyhash: ko.observable(appsrvc.pubkeyhash),
                    privatekey: ko.observable(peermsg.aes256encrypt(appsrvc.privateKeyHex, JSON.stringify(appsrvc.privateKeyHex))),
                    mnemonic_phrase: ko.observable(peermsg.aes256encrypt(appsrvc.mnemonicPhrase, JSON.stringify(appsrvc.mnemonicPhrase))),
                    seeds: ko.observableArray([]),
                    port: ko.observable(appsrvc.port),
                    address: ko.observable(appsrvc.host),
                    wsprotocol: ko.observable(appsrvc.wsprotocol),
                    upnpaddress: ko.observable(appsrvc.upnpaddress),
                    upnpgateway: ko.observable(appsrvc.upnpgateway),
                    transport: ko.observable(appsrvc.transport),
                    net_connected: ko.observable(appsrvc.net_connected),
                    wshub: ko.observable(appsrvc.wsprotocol + '://' + appsrvc.wshost + ":" + appsrvc.wsport),
                    seeds: ko.observableArray([]),
                    decrypePrivKey: ko.observable(),
                    decrypeMnemPr: ko.observable(),

                    isaccount_error: ko.observable(false),
                    accounts: ko.observableArray([]),
                    accounts: ko.observable(accounts.list),
                    accounterrormsg: ko.observable(""),
                    ispwd_error: ko.observable(false),
                    private_key_pwd: ko.observable(""),
                    pwderrormsg: ko.observable(""),
                    account: ko.observable(""),
                    prKeyAfterPass: ko.observable(false),
                    mnemonicVisible: ko.observable(false),
                    privateVisible: ko.observable(false),
                    passProtectedVisible: ko.observable(true),
                    mnemonicPhraseVisible: ko.observable(true),


                    showPrivateKey: function () {
                        $('#protectedModal').modal();
                    },

                    showMemPhrase: function () {
                        $('#protectedMemPhraseModal').modal();
                    },

                    ctrlkeyup: function(d, e) {
                        if (e.keyCode == 13) {
                            return false;
                        }
                    },

                    ctrlkeyupformnemonic: function (d, event) {
                        if (event.keyCode === 13) {
                            return false;
                        }
                    },

                    onPasswordChange: function() {

                        viewModel.ispwd_error(false);
                        viewModel.pwderrormsg("");

                        var val = $.trim(viewModel.private_key_pwd());

                        if (!val) {
                            viewModel.pwderrormsg(i18next.t("errmsg-createaccount-pwdrequired"));
                            viewModel.ispwd_error(true);
                            return false;
                        }

                        viewModel.ispwd_error(false);
                        return val;
                    },

                    validateAccountText: function () {
                        var selected = viewModel.account();
                        if (!selected || !selected.account) {
                            viewModel.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                            viewModel.isaccount_error(true);
                            return false;
                        }

                        var ck_account = /^[A-Za-z0-9]{4,20}$/;
                        if (!ck_account.test(selected.account)) {
                            viewModel.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                            viewModel.isaccount_error(true);
                            return false;
                        }
                        else {
                            viewModel.isaccount_error(false);
                            return selected;
                        }
                    },

                    initialize_account: function (e) {
                        var timer = 0;
                        var processed = false;
                        try {
                            var accobj = viewModel.validateAccountText();
                            if (!accobj) {
                                return;
                            }

                            var password = viewModel.onPasswordChange();
                            if (!password) return;

                            var valid = user.initialize(accobj, password, function (err) {
                                if (err) {
                                    return streembit.notify.error("Account initialize error: %j", err);
                                }

                                appsrvc.account_connected = false;
                                appevents.emit(appevents.APPEVENT, appevents.TYPES.ONUSRKEYINIT); 

                                $('#protectedModal').modal('hide');
                                $('.modal-backdrop').fadeOut();

                                viewModel.privateVisible(true);
                                viewModel.passProtectedVisible(false);
                                var decprivkey = peermsg.aes256decrypt(appsrvc.privateKeyHex, viewModel.privatekey());
                                viewModel.privatekey(decprivkey);
                               
                            });                   
                        }
                        catch (err) {
                            uihandler.unblockwin();
                            processed = true;
                            if (timer) {
                                clearTimeout(timer);
                            }
                            streembit.notify.error("Account initialization error %j", err);
                        }
                    },

                    initialize_account_for_mnemonic: function () {
                        var timer = 0;
                        var processed = false;
                        try {
                            var accobj = viewModel.validateAccountText();
                            if (!accobj) {
                                return;
                            }
                            // debugger;
                            var password = viewModel.onPasswordChange();
                            if (!password) return;

                            var valid = user.initialize(accobj, password, function (err) {
                                if (err) {
                                    return streembit.notify.error("Account initialize error: %j", err);
                                }

                                appsrvc.account_connected = false;
                                appevents.emit(appevents.APPEVENT, appevents.TYPES.ONUSRKEYINIT); 

                                $('#protectedMemPhraseModal').modal('hide');
                                $('.modal-backdrop').fadeOut();
                                viewModel.mnemonicVisible(true);
                                viewModel.mnemonicPhraseVisible(false);

                                var decmnemphrase = peermsg.aes256decrypt(appsrvc.mnemonicPhrase, viewModel.mnemonic_phrase());
                                viewModel.mnemonic_phrase(decmnemphrase);
                               
                            });                   
                        }
                        catch (err) {
                            uihandler.unblockwin();
                            processed = true;
                            if (timer) {
                                clearTimeout(timer);
                            }
                            streembit.notify.error("Account initialization error %j", err);
                        }
                    },

                    restore_account: function () {
                        apputils.restore_account(function (err) {
                            if (err) {
                                return streembit.notify.error("Restore account error: %j", err);
                            }

                            appsrvc.account_connected = false;
                            appevents.navigate("dashboard");

                            appevents.emit(appevents.APPEVENT, appevents.TYPES.ONUSRKEYINIT);
                           
                        });
                    },

                };

                return viewModel;
            }           

            return {
                viewModel: NetInfoVm,
                template: template
            };
        }
    );

}());



