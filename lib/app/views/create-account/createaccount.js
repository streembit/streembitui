
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
        ['i18next', 'appevents', 'user', 'peercomm', 'appsrvc', 'definitions', 'uihandler', 'accounts', 'streembitnet', 'settings', './createaccount.html!text'],
        function (i18next, appevents, user, peercomm, appsrvc, defs, uihandler, accounts, streembitnet, settings, template) {

        function CreateAccountVm(params) {
            this.ispwd_error = ko.observable(false);
            this.isconfpwd_error = ko.observable(false);
            this.isaccount_error = ko.observable(false);
            this.ismnemonic_error = ko.observable(false);
            this.ismnemonic_visible = (params && params.mode && params.mode === 'restore') ? ko.observable(true) : ko.observable(false);
            this.valid_mnemonic = ko.observable(false);
            this.private_key_pwd = ko.observable("");
            this.private_keypwd_conf = ko.observable("");
            this.account = ko.observable("");
            this.mnemonic = ko.observable("");
            this.pwderrormsg = ko.observable("");
            this.pwdconferrormsg = ko.observable("");
            this.accounterrormsg = ko.observable("");
            this.mnemonicerrormsg = ko.observable("");

            this.ctrlkeyup = function(d, e) {
                if (e.keyCode == 13) {
                    return this.submit();
                }
            };

            this.ctrlchange = function (changeHandler) {
                this[changeHandler]();
            };

            this.onPasswordChange = function() {

                this.ispwd_error(false);
                this.pwderrormsg("");

                var val = $.trim(this.private_key_pwd());

                if (!val) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-pwdrequired"));
                    this.ispwd_error(true);
                    return false;
                }

                if (val.length < 8) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-pwdlength"));
                    this.ispwd_error(true);
                    return false;
                }

                if (val.indexOf(' ') > -1) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-nospaceallowed"));
                    this.ispwd_error(true);
                    return false;
                }

                var valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if (asciicode > 96 && asciicode < 123) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-lowercaseneed"));
                    this.ispwd_error(true);
                    return false;
                }

                valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if (asciicode > 64 && asciicode < 91) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-uppercaseneed"));
                    this.ispwd_error(true);
                    return false;
                }

                var ck_nums = /\d/;
                if (!ck_nums.test(val)) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-digitneed"));
                    this.ispwd_error(true);
                    return false;
                }

                valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if ((asciicode > 32 && asciicode < 48) ||
                        (asciicode > 57 && asciicode < 65) ||
                        (asciicode > 90 && asciicode < 97) ||
                        (asciicode > 122 && asciicode < 127)) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-specialcharneed"));
                    this.ispwd_error(true);
                    return false;
                }

                var pass_conf = this.private_keypwd_conf();
                if (pass_conf.length > 0) {
                    if (val !== pass_conf) {
                        this.pwdconferrormsg(i18next.t("errmsg-createaccount-pwdconfirm"));
                        this.isconfpwd_error(true);
                        return false;
                    } else {
                        this.pwdconferrormsg("");
                        this.isconfpwd_error(false);
                    }
                }

                return val;
            };

            this.onPasswordConfirmChange = function() {
                this.pwdconferrormsg("");
                this.isconfpwd_error(false);

                var val = $.trim(this.private_keypwd_conf());
                if (!val) {
                    this.pwdconferrormsg(i18next.t("errmsg-createaccount-pwdconfirm"));
                    this.isconfpwd_error(true);
                    return false;
                }

                var pwd = $.trim(this.private_key_pwd());
                if (pwd != val) {
                    this.pwdconferrormsg(i18next.t("errmsg-createaccount-pwdconfirmmatch"));
                    this.isconfpwd_error(true);
                    return false;
                }

                return true;
            };

            this.validateAccountText = function() {
                var val = $.trim(this.account());

                var ck_account = /^[A-Za-z0-9]{6,20}$/;
                if (!ck_account.test(val)) {
                    this.accounterrormsg(i18next.t("errmsg-createaccount-accountname"));
                    this.isaccount_error(true);
                    return false;
                }
                else {
                    if (accounts.exists(val)) {
                        this.accounterrormsg(i18next.t("errmsg-createaccount-exists"));
                        this.isaccount_error(true);
                        return false;
                    }
                    else {
                        return val;
                    }
                }
            };

            this.onAccountChange = function () {
                this.isaccount_error(false);
                this.accounterrormsg("");

                this.validateAccountText();
            };

            this.restore_account = function () {
              appevents.navigate("restorebymnemonic");
            };

            this.show_mnemonic_inp = function () {
                this.ismnemonic_visible(true);
            };

            this.cancel_form = function () {
                if (this.ismnemonic_visible()) {
                    this.cancel_mnemonic();
                    return;
                }

                this.cancel_normal();
            };

            this.cancel_mnemonic = function () {
                this.mnemonic("");
                this.valid_mnemonic(false);
                this.ismnemonic_visible(false);
                this.ismnemonic_error(false);
                this.mnemonicerrormsg("");
            };

            this.cancel_normal = function () {
                if (accounts.list.length) {
                    return appevents.navigate("connectpublic");
                }

                return streembit.notify.error("There is no existing user Streembit account in the database. Please create an account to continue.");
            };

            this.onMnemonicBlur = function() {
                this.ismnemonic_error(false);
                this.mnemonicerrormsg("");

                if (!this.validateMnemonicText()) {
                    return false;
                }

                this.valid_mnemonic(true);

                return true;
            };

            this.validateMnemonicText = function () {
                var mnemonic = this.mnemonic();
                mnemonic = $.trim(mnemonic).replace(/[\r\n]/, ' ').replace(/\s+/, ' ');
                if (!mnemonic || mnemonic.length < 36) {
                    return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                }

                var Rx_mne = /^[a-z ]+$/i;
                if (!Rx_mne.test(mnemonic)) {
                    return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                }

                var mne_r = mnemonic.split(' ');
                if (mne_r.length < 12) {
                    return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                }

                $.each(mne_r, (idx, mne) => {
                    if (mne.length < 3) {
                        return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                    }
                });

                if (!user.validate_mnemonic(mnemonic)) {
                   return this.validateMnemonicFailed("errmsg-remnemonic-validation-failed");
                }

                return true;
            };

            this.validateMnemonicFailed = function(i18n_msg) {
                this.mnemonicerrormsg(i18next.t(i18n_msg));
                this.ismnemonic_error(true);
                return false;
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

            this.create = function (account, password ) {
                return new Promise((resolve, reject) => {
                    user.create_key(password, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            };

            this.submit = function () {
                var processed = false;
                var timer = 0;     
                try {
                    if (this.ismnemonic_visible() && !this.valid_mnemonic() && !this.validateMnemonicText()) {
                        return;
                    }

                    var account = this.validateAccountText();
                    if (!account) {
                        return;
                    }

                    var password = this.onPasswordChange();
                    if (!password) return;

                    var valid = this.onPasswordConfirmChange();
                    if (!valid) return;

                    var self = this;                                  

                    appsrvc.account_connected = false;

                    // block the UI
                    uihandler.blockwin();
                    if (this.valid_mnemonic()) {
                        user.mnemonic = this.mnemonic();
                    }
                    user.create_key(password, this.valid_mnemonic(), function (err) {
                        if (err) {
                            uihandler.unblockwin();
                            return streembit.notify.error("Error in creating the account: %j", err);
                        }

                        user.save_account(account, function (err) {
                            if (err) {
                                uihandler.unblockwin();
                                return streembit.notify.error("Error in saving the account to local database: %j", err);
                            }

                            settings.update_accountexists(true, function (err) {
                                if (err) {
                                    uihandler.unblockwin();
                                    return streembit.notify.error("Update settings error %j", err);
                                }

                                uihandler.unblockwin();
                                appevents.navigate("dashboard");
                            });        
                        });
                    });
                   
                    //
                }
                catch (err) {
                    // unblock the UI
                    uihandler.unblockwin();
                    processed = true;
                    if (timer) {
                        clearTimeout(timer);
                    }
                    streembit.notify.error("Error in creating the account user: %j", err);
                }
            };
        }

        return {
            viewModel: CreateAccountVm,
            template: template
        };
    });

}());



