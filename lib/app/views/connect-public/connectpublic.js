/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/


'use strict';

(function () {

    define(
        ['knockout', 'i18next', 'appevents', 'user', 'peercomm', 'appsrvc', 'definitions', 'uihandler', 'accounts', 'streembitnet', './connectpublic.html!text'],
        function (ko, i18next, appevents, user, peercomm, appsrvc, defs, uihandler, accounts, streembitnet, template) {

        function ConnectPublicVm(params) {

            this.ispwd_error = ko.observable(false);
            this.isaccount_error = ko.observable(false);
            this.private_key_pwd = ko.observable("");
            this.account = ko.observable("");
            this.pwderrormsg = ko.observable("");
            this.accounterrormsg = ko.observable("");
            this.accounts = ko.observableArray([]);
            this.accounts(accounts.list);

            this.ctrlkeyup = function(d, e) {
                if (e.keyCode == 13) {
                    this.initialize_account();
                }
            }

            this.onPasswordChange = function() {

                this.ispwd_error(false);
                this.pwderrormsg("");

                var val = $.trim(this.private_key_pwd());

                if (!val) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-pwdrequired"));
                    this.ispwd_error(true);
                    return false;
                }

                return val;
            }

            this.validateAccountText = function () {
                var selected = this.account();
                if (!selected || !selected.account) {
                    this.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                    this.isaccount_error(true);
                    return false;
                }

                var ck_account = /^[A-Za-z0-9]{6,20}$/;
                if (!ck_account.test(selected.account)) {
                    this.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                    this.isaccount_error(true);
                    return false;
                }
                else {
                    return selected;
                }
            };

            this.publish = function () {
                return new Promise((resolve, reject) => {
                    var public_key = appsrvc.publicKeyBs58;
                    var address = appsrvc.address;
                    var port = appsrvc.port;
                    var transport = appsrvc.transport;
                    var type = appsrvc.usertype;
                    var symcryptkey = appsrvc.connsymmkey;

                    peercomm.publish_user(symcryptkey, appsrvc.pubkeyhash, public_key, transport, address, port, type, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                    
                });
            };

            this.initialize_account = function () {
                try {
                    var accobj = this.validateAccountText();
                    if (!accobj) {
                        return;
                    }

                    var password = this.onPasswordChange();
                    if (!password) return;


                    // initialize account
                    var valid = user.initialize(accobj, password);
                    if (!valid) { return; }

                    if (!appsrvc.pubkeyhash) {
                        return streembit.notify.error("Error in creating base58 public key");
                    }

                    appsrvc.account_connected = false;

                    // block the UI
                    uihandler.blockwin();

                    var self = this;

                    streembitnet.init()
                        .then(() => {
                            return self.publish();
                        })
                        .then(() => {
                            // unblock the UI
                            uihandler.unblockwin();
                            appsrvc.account_connected = true;
                            appevents.dispatch("account-init", accobj.account);
                            appevents.navigate("streembit-app");
                            streembit.notify.success("The account has been initialized on the Streembit network.", null, true);

                            // register
                            streembitnet.register_at_ws();
                            //
                        })
                        .catch(function (err) {
                            // unblock the UI
                            uihandler.unblockwin();
                            streembit.notify.error("Error in publishing user: %j", err);
                        });

                    //     
                }
                catch (err) {
                    uihandler.unblockwin();
                    streembit.notify.error("Account initialization error %j", err);
                }
            }
        }

        return {
            viewModel: ConnectPublicVm,
            template: template
        };
    });

}());



