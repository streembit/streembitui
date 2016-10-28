import BaseVM from "../BaseVM";
import i18next from 'i18next';
import appevents from "../../libs/events/AppEvents";
import user from "../../user";
import peercomm from "../../peercomm";
import appsrvc from "../../appsrvc";
import defs from "../../definitions";
import uihandler from "../../uihandler";

export default class CreateAccountVm extends BaseVM { 
    constructor(params) {
        super(params);

        this.ispwd_error = ko.observable(false);
        this.isconfpwd_error = ko.observable(false);
        this.isaccount_error = ko.observable(false);
        this.private_key_pwd = ko.observable("aaaaaaA1!");
        this.private_keypwd_conf = ko.observable("aaaaaaA1!");
        this.account = ko.observable("aaaaaa");
        this.pwderrormsg = ko.observable("");
        this.pwdconferrormsg = ko.observable("");
        this.accounterrormsg = ko.observable("");        
    }

    ctrlkeyup (d, e) {
        if (e.keyCode == 13) {
            this.create_account();
        }
    }

    onPasswordChange() {

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

    onPasswordConfirmChange() {
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

    check_account_exists(account, callback) {
        // 1. check if it exists on the local database
        // 2. check if it exist on the network

        if (!account) {
            return alert("Account name is required");
        }

        peercomm.get_published_contact(account, function (err, contact) {
            if (err) {
                // check the error
                if (err.message && err.message.indexOf("0x0100") > -1) {
                    // error code 0x0100 error indicates the key does not exists
                    return callback(null, false);
                }
            }
            var exists = contact && contact.name == account;
            callback(null, exists);
        });

        callback(null, false)
    }

    validateAccountText() {
        var val = $.trim(this.account());

        var ck_account = /^[A-Za-z0-9]{6,20}$/;
        if (!ck_account.test(val)) {
            this.accounterrormsg(i18next.t("errmsg-createaccount-accountname"));
            this.isaccount_error(true);
            return false;
        }
        else {
            return val;
        }
    }

    onAccountChange() {        
        this.isaccount_error(false);
        this.accounterrormsg("");

        var account = this.validateAccountText();
        if (!account) {
            return;
        }

        var self = this;
        this.check_account_exists(account, function (err, exists) {
            if (err) {
                return streembit.notify.error("Account exists error: %s", err);
            }
            if (exists) {
                self.accounterrormsg(i18next.t("errmsg-createaccount-exists"));
                self.isaccount_error(true);
            }
        });        
    }

    create_account() {
        var account = this.validateAccountText();
        if (!account) {
            return;
        }

        var password = this.onPasswordChange();
        if (!password) return;

        var valid = this.onPasswordConfirmChange();
        if (!valid) return;

        try {
            // block the UI
            uihandler.blockwin();

            user.create_account(account, password, function (err) {
                if (err) {
                    // unblock the UI
                    uihandler.unblockwin(); 
                    return streembit.notify.error("Create account error: %j", err);
                }

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
            });
        }
        catch (err) {
            // unblock the UI
            uihandler.unblockwin(); 
            streembit.notify.error("Error in publishing user: %j", err);
        }
    }

}


