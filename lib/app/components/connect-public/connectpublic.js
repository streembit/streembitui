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

    define(['knockout', 'i18next', 'appevents', 'user', 'peercomm', 'appsrvc', 'definitions', 'uihandler', 'accounts', './connectpublic.html!text'], function (ko, i18next, appevents, user, peercomm, appsrvc, defs, uihandler, accounts, template) {

        function ConnectPublicVm(params) {
            this.route = (params && params.route) ? params.route : 0;
            this.page = (params && params.page) ? params.page : 0;

            this.ispwd_error = ko.observable(false);
            this.isaccount_error = ko.observable(false);
            this.private_key_pwd = ko.observable("aaaaaaA1!");
            this.account = ko.observable("aaaaaa");
            this.pwderrormsg = ko.observable("");
            this.accounterrormsg = ko.observable("");
            this.accounts = ko.observableArray([]);

            var accountlist = accounts.list;
            if (!accountlist || !accountlist.length) {
                // there is no account exists -> navigate to new account
                return appevents.navigate("createaccount");
            }

            this.accounts(accountlist);

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

            this.validateAccountText = function() {
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
            }


            this.initialize_account = function() {
                var account = this.validateAccountText();
                if (!account) {
                    return;
                }

                var password = this.onPasswordChange();
                if (!password) return;

                try {
                    // block the UI
                    //uihandler.blockwin();

                    // initialize account
                    var valid = user.initialize(account, password);
                    if (!valid) {
                        return;
                    }

                    // connec to the Streembit network

                    var public_key = user.public_key;
                    var address = appsrvc.address;
                    var port = appsrvc.port;
                    var transport = appsrvc.transport;
                    var type = defs.USER_TYPE_HUMAN

                    appsrvc.account_connected = false;

                    peercomm.publish_user(public_key, transport, address, port, type, function (err) {
                        if (err) {
                            streembit.notify.error("Error in publishing user: %j", err);
                        }
                        else {
                            appsrvc.account_connected = true;
                            streembit.notify.success("The account has been created and published to the Streembit network.");
                            appevents.navigate("about");
                        }
                        // unblock the UI
                        uihandler.unblockwin();
                    });

                }
                catch (err) {
                    // unblock the UI
                    uihandler.unblockwin();
                    streembit.notify.error("Error in publishing user: %j", err);
                }
            }
        }

        return {
            viewModel: ConnectPublicVm,
            template: template
        };
    });

}());



