
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
        ['i18next', 'appsrvc', 'user', 'appevents', 'accounts', 'errhandler', 'errcodes', './changepwd.html!text' ],
        function (i18next, appsrvc, user, appevents, accounts, errhandler, errcodes, template) {

            function ChangePwdVm(params) {

                if (!appsrvc.username) {
                    appevents.navigate("dashboard");
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_CHANGE_PWD_INIT-ACCOUNT));
                }

                this.accountname = ko.observable(appsrvc.username);
                this.ispwd_error = ko.observable(false);
                this.isconfpwd_error = ko.observable(false);
                this.private_key_pwd = ko.observable("");
                this.private_keypwd_conf = ko.observable("");
                this.pwderrormsg = ko.observable("");
                this.pwdconferrormsg = ko.observable("");    

                this.onPasswordChange = function () {

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

                    return val;
                }

                this.onPasswordConfirmChange = function () {
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
                }

                this.submit = function () {
                    try {
                        var self = this;

                        var password = this.onPasswordChange();
                        if (!password) return;

                        var valid = this.onPasswordConfirmChange();
                        if (!valid) return;

                        var self = this;
                        user.change_password(user, password, function (err) {
                            if (err) {
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_ERROR_CHANGING_PWD, err));
                            }
                            else {
                                streembit.notify.info("The password for account " + self.accountname() + " was changed");
                                appevents.navigate("dashboard");
                            }
                        });
                    }
                    catch (err) {
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_ERROR_CHANGING_PWD, err));
                    }
                };
            }

            return {
                viewModel: ChangePwdVm,
                template: template
            };
        }
    );

}());



