import BaseVM from "../BaseVM";
import i18next from 'i18next';
import appevents from "../../libs/events/AppEvents";
import user from "../../user";
import peercomm from "../../peercomm";
import appsrvc from "../../appsrvc";
import defs from "../../definitions";
import uihandler from "../../uihandler";
import database from "../../database";

export default class ConnectPublicVm extends BaseVM { 
    constructor(params) {
        super(params);

        this.ispwd_error = ko.observable(false);
        this.isaccount_error = ko.observable(false);
        this.private_key_pwd = ko.observable("aaaaaaA1!");
        this.account = ko.observable("aaaaaa");
        this.pwderrormsg = ko.observable("");
        this.accounterrormsg = ko.observable("");  
        this.accounts = ko.observableArray([]);

        this.get_accounts();
    }

    get_accounts() {
        var self = this;

        database.getall(database.ACCOUNTSDB, function (err, result) {
            if (err) {
                return streembit.notify.error("Error in populating accounts from database. %j", err);
            }

            if (!result || !result.length) {
                // there is no account exists -> navigate to new account
                return appevents.navigate("createaccount");
            }

            self.accounts(result);
        });
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

    validateAccountText() {
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


    create_account() {
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

            /*
            user.initialize(account, password, function (err) {
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
            */
        }
        catch (err) {
            // unblock the UI
            uihandler.unblockwin(); 
            streembit.notify.error("Error in publishing user: %j", err);
        }
    }

}


