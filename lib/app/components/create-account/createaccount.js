import BaseVM from "../BaseVM";
import i18next from 'i18next';
import appevents from "../../libs/events/AppEvents";
import user from "../../user";
import peercomm from "../../peercomm";
import appsrvc from "../../appsrvc";
import defs from "../../definitions";

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

    create_account() {
        console.log("login()");
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
        
        return true;      
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

    check_account_exists(accountname, callback) {
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
            return true;
        }
    }

    onAccountChange() {        
        this.isaccount_error(false);
        this.accounterrormsg("");

        if (!this.validateAccountText()) {
            return;
        }

        var val = $.trim(this.account());

        var ck_account = /^[A-Za-z0-9]{6,20}$/;
        if (!ck_account.test(val)) {
            this.accounterrormsg(i18next.t("errmsg-createaccount-accountname"));
            this.isaccount_error(true);
            return false;
        }

        var self = this;
        this.check_account_exists(val, function (err, exists) {
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
        if (!this.validateAccountText()) {
            return;
        }

        var valid = this.onPasswordChange();
        if (!valid) return;

        valid = this.onPasswordConfirmChange();
        if (!valid) return;

        var account = $.trim(this.account());
        var password = $.trim(this.private_key_pwd());

        console.log(account);
        console.log(password);

        user.create_account(account, password, function (err) {
            if (err) {
                return streembit.notify.error("Create account error: %j", err);
            }

            var public_key = user.public_key;
            var address = appsrvc.address;
            var port = appsrvc.port;
            var transport = appsrvc.transport;
            var type = defs.USER_TYPE_HUMAN

            appsrvc.account_connected = false;

            percomm.publish_user(public_key, transport, address, port, type, function (err) {
                if (err) {
                    streembit.notify.error("Error in publishing user: %j", err);
                }
                else {
                    appsrvc.account_connected = true;
                    streembit.notify.success("The account has been created and published to the Streembit network.");
                    appevents.navigate("about");
                }
            });            
        });
    }

}


