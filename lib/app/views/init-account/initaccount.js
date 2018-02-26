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
        ['i18next', 'appevents', 'apputils', 'errcodes', 'errhandler', 'user', 'appsrvc', 'definitions', 'uihandler', 'accounts', './initaccount.html!text'],
        function (i18next, appevents, apputils, errcodes, errhandler, user, appsrvc, defs, uihandler, accounts, template) {

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

                this.ispwd_error(false);
                return val;
            }

            this.validateAccountText = function () {
                var selected = this.account();
                if (!selected || !selected.account) {
                    this.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                    this.isaccount_error(true);
                    return false;
                }

                var ck_account = /^[A-Za-z0-9]{4,20}$/;
                if (!ck_account.test(selected.account)) {
                    this.accounterrormsg(i18next.t("errmsg-connectaccount-select"));
                    this.isaccount_error(true);
                    return false;
                }
                else {
                    this.isaccount_error(false);
                    return selected;
                }
            };
            
            this.new_account = function () {
                appevents.navigate("createaccount");
            };

            this.restore_dialog = function () {
                var self = this;
                $.sound_on = false;
                $.SmartMessageBox({
                    title : "Choose restore type",
                    content : "you can restore either from backup, or from mnemonic",
                    buttons : '[Restore from backup][Restore from mnemonic]'
                }, function (ButtonPressed) {
                    if (ButtonPressed === 'Restore from backup') {
                        $('.divMessageBox').hide();
                        self.restore_account();
                    } else if (ButtonPressed === 'Restore from mnemonic') {
                        $('.divMessageBox').hide();
                        appevents.navigate("createaccount", { mode: 'mnemonic' });
                    }
                });
            };

            this.restore_account = function () {
                apputils.restore_account(function (err) {
                    if (err) {
                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_ACCOUNTRESTORE, err));
                    }

                    appsrvc.account_connected = false;
                    appevents.navigate("dashboard");

                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONUSRKEYINIT);
                   
                });
            };

            this.initialize_account = function () {
                var timer = 0;
                var processed = false;
                try {
                    var accobj = this.validateAccountText();
                    if (!accobj) {
                        return;
                    }

                    var password = this.onPasswordChange();
                    if (!password) return;


                    // initialize account
                    var valid = user.initialize(accobj, password, function (err) {
                        if (err) {
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_ACCOUNTINIT, err));
                        }

                        appsrvc.account_connected = false;
                        appevents.navigate("dashboard");

                        appevents.emit(appevents.APPEVENT, appevents.TYPES.ONUSRKEYINIT);   
                    });                   

                    //     
                }
                catch (err) {
                    uihandler.unblockwin();
                    processed = true;
                    if (timer) {
                        clearTimeout(timer);
                    }
                    streembit.notify.error(errhandler.getmsg(errcodes.UI_ACCOUNTINIT, err));
                }
            }
        }

        return {
            viewModel: ConnectPublicVm,
            template: template
        };
    });

}());



