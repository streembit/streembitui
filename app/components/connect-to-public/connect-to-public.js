define(['knockout', 'text!./connect-to-public.html', 'appsrvc', 'accountsrvc'], function (ko, template, appsrvc, accountsrvc) {

    function ConnToPublicVM(params) {
        var viewModel = {
            route: params.route,
            testobj: ko.observable("some text label"),
            account: ko.observable(),
            private_key_pwd: ko.observable(),
            private_key_pwd_conf: ko.observable(),
            is_new_account: ko.observable(!accountsrvc.is_account_exists()),
            accounts: ko.observableArray([]),
            selected_account: ko.observable(),
            is_account_exists: ko.observable(false),
            is_private_network: ko.observable(false),
            private_net_host: ko.observable(),  
            private_net_account: ko.observable(),
            private_net_port: ko.observable(),
 
            init: function (callback) {
                viewModel.is_private_network(appsrvc.network_type == streembit.DEFS.PRIVATE_NETWORK);
                if (appsrvc.network_type == streembit.DEFS.PRIVATE_NETWORK) {
                    if (config && config.private_net_seed) {
                        if (config.private_net_seed.account) {
                            viewModel.private_net_account(config.private_net_seed.account);
                        }
                        if (config.private_net_seed.host) {
                            viewModel.private_net_host(config.private_net_seed.host);
                        }
                        if (config.private_net_seed.port) {
                            viewModel.private_net_port(config.private_net_seed.port);
                        }
                    }
                }

                if (!viewModel.is_new_account()) {
                    this.get_accounts(function () {
                        callback(null);
                    });

                    if (is_init_existing_account) {
                        viewModel.caption_btninit("Initialize");
                        viewModel.caption_view_title("Initialize existing account");
                    }
                    else {
                        viewModel.caption_view_title("Connect to Streembit network");
                    }
                }
                else {
                    viewModel.caption_view_title("Create your Streembit user account");
                    viewModel.accounts([]);
                    callback(null);
                }
            },

            get_accounts: function (callback) {
                streembit.DB.getall(streembit.DB.ACCOUNTSDB, function (err, result) {
                    if (err) {
                        return streembit.notify.error_popup("streembit.DB.getall accounts error %j", err);
                    }

                    if (!result || !result.length) {
                        viewModel.is_new_account(true);
                        viewModel.accounts([]);
                        viewModel.is_account_exists(false);
                    }
                    else {
                        viewModel.accounts(result);
                        viewModel.is_account_exists(true);
                    }
                    callback();
                });
            },

            set_newaccount_mode: function () {
                this.is_new_account(true);
            },

            check_account_exists: function (account, callback) {
                if (!account) {
                    return alert("Account name is required");
                }

                if (this.avaialable_acc == account) {
                    //  show the check icon
                    return;
                }

                streembit.PeerNet.get_published_contact(account, function (err, contact) {
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
            },

            validateAccountText: function () {
                var val = $.trim(this.account());
                var ck_account = /^[A-Za-z0-9]{6,20}$/;
                if (!ck_account.test(val)) {
                    validateAccount(false, "The account name must be between 6-20 characters and it can only contain alphanumeric characters (letters a-z, A-Z and numbers 0-9)");
                    return false;
                }
                else {
                    validateAccount(true);
                    return val;
                }
            },

            onAccountChange: function () {
                var val = $.trim(this.account());
                if (this.is_new_account() == false) {
                    if (!val) {
                        validateAccount(false, "The account name is required");
                        return false;
                    }
                    else {
                        validateAccount(true);
                        return true;
                    }
                }
                else {
                    var val = this.validateAccountText();
                    if (!val) {
                        return;
                    }

                    this.check_account_exists(val, function (err, exists) {
                        if (err) {
                            return streembit.notify.error(err);
                        }
                        if (exists) {
                            validateAccount(false, "Account '" + val + "' already exists on the network. Please define an other account name");
                        }
                        else {
                            validateAccount(true);
                        }
                    });
                }
            },

            onPasswordChange: function () {
                var val = $.trim(this.private_key_pwd());

                if (this.is_new_account() == false) {
                    if (!val) {
                        validatePassword(false, "Password is required");
                        return false;
                    }
                    else {
                        validatePassword(true);
                        return true;
                    }
                }
                else {
                    if (!val) {
                        validatePassword(false, "Password is required");
                        return false;
                    }
                    if (val.length < 8) {
                        validatePassword(false, "The password must be at least 8 characters");
                        return false;
                    }
                    if (val.indexOf(' ') > -1) {
                        validatePassword(false, "The password must not contain empty space");
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
                        validatePassword(false, "The password must contain at least one lower case letter.");
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
                        validatePassword(false, "The password must contain at least one upper case letter.");
                        return false;
                    }

                    var ck_nums = /\d/;
                    if (!ck_nums.test(val)) {
                        validatePassword(false, "The password must contain at least one digit.");
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
                        validatePassword(false, "The password must contain at least one special character.");
                        return false;
                    }

                    validatePassword(true);
                    return true;
                }
            },

            onPasswordConfirmChange: function () {
                var val = $.trim(this.private_key_pwd_conf());
                if (!val) {
                    validatePasswordConfirm(false, "Password confirm is required");
                    return false;
                }

                var pwd = $.trim(this.private_key_pwd());
                if (pwd != val) {
                    validatePasswordConfirm(false, "The password and its confirm are not the same");
                    return false;
                }

                validatePasswordConfirm(true);
                return true;
            },

            onPrivateSeedHostChange: function () {
                var val = $.trim(this.private_net_host());
                if (!val) {
                    validatePrivateSeedHost(false, "Host is required for private Streembit seed");
                    return false;
                }

                var index = val.indexOf(".");
                if (index == -1) {
                    validatePrivateSeedHost(false, "An IP address or domain name is required for private Streembit seed");
                    return false;
                }

                validatePrivateSeedHost(true);
                return true;
            },

            onPrivateSeedPortChange: function () {
                var val = $.trim(this.private_net_port());
                if (!val) {
                    validatePrivateSeedPort(false, "Port is required for private Streembit seed");
                    return false;
                }

                try {
                    if (isNaN(val)) {
                        validatePrivateSeedPort(false, "A numeric port value is required for a private Streembit seed");
                        return false;
                    }
                }
                catch (e) {
                    validatePrivateSeedPort(false, "A numeric port value is required for a private Streembit seed");
                    return false;
                }

                validatePrivateSeedPort(true);
                return true;
            },

            onPrivateSeedAccountChange: function () {
                var val = $.trim(this.private_net_account());
                if (!val) {
                    validatePrivateSeedAccount(false, "Account is required for private Streembit seed");
                    return false;
                }

                validatePrivateSeedAccount(true);
                return true;
            },

            create_account: function () {
                try {
                    var valid;

                    if (this.is_private_network() == true) {
                        valid = this.onPrivateSeedHostChange();
                        if (!valid) return;

                        valid = this.onPrivateSeedPortChange();
                        if (!valid) return;

                        valid = this.onPrivateSeedAccountChange();
                        if (!valid) return;

                        var seed = {
                            account: $.trim(this.private_net_account()),
                            host: $.trim(this.private_net_host()),
                            port: parseInt($.trim(this.private_net_port()))
                        }

                        streembit.Main.private_net_seed = seed;
                    }

                    var account = this.validateAccountText();
                    if (!account) return;

                    valid = this.onPasswordChange();
                    if (!valid) return;

                    valid = this.onPasswordConfirmChange();
                    if (!valid) return;

                    // call the viewmodel
                    var pwd = this.private_key_pwd();

                    streembit.User.create_account(account, pwd, function () {
                        streembit.notify.success("The account has been created. You can connect to the Streembit network.");
                        streembit.UI.show_startscreen();
                    });
                }
                catch (err) {
                    streembit.notify.error("Create account error %j", err);
                }
            },

            login: function () {
                try {
                    var valid;

                    if (this.is_private_network() == true) {
                        valid = this.onPrivateSeedHostChange();
                        if (!valid) return;

                        valid = this.onPrivateSeedPortChange();
                        if (!valid) return;

                        valid = this.onPrivateSeedAccountChange();
                        if (!valid) return;

                        var seed = {
                            account: $.trim(this.private_net_account()),
                            host: $.trim(this.private_net_host()),
                            port: parseInt($.trim(this.private_net_port()))
                        }

                        streembit.Main.private_net_seed = seed;
                    }

                    var account = this.selected_account();
                    if (!account) {
                        validateAccount(false, "Select an account from the dropdown list");
                        return;
                    }

                    valid = this.onPasswordChange();
                    if (!valid) return;

                    var pwd = this.private_key_pwd();

                    streembit.User.initialize(account, pwd, function (err) {
                        streembit.notify.log_info("The account for " + account.account + " has been initialized");
                        if (is_init_existing_account) {
                            streembit.UI.show_startscreen();
                        }
                    });

                }
                catch (err) {
                    streembit.notify.error("Create account error %j", err);
                }
            },

            ctrlKeyUp: function (d, e) {
                if (e.keyCode == 13) {
                    if (viewModel.is_new_account() == false) {
                        viewModel.login();
                    }
                    else if (viewModel.is_new_account() == true) {
                        viewModel.create_account();
                    }
                }
            }
        };

        viewModel.init();

        return viewModel;
    }    

    return { viewModel: ConnToPublicVM, template: template };
});
