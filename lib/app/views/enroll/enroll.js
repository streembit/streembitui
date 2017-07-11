/*

This file is part of DoorClient application. 
DoorClient is an open source project to manage reliable identities. 

DoorClient is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

DoorClient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with DoorClient software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define(['appevents', 'moisrvc', 'uihandler', 'user', 'jsrsasign', 'settings', './enroll.html!text'],
        function ( appevents, moisrvc, uihandler, user, jsrsa, settings, template) {

        var EnrollStep = function (id, name, template, selected) {
            this.id = id;
            this.name = name;
            this.template = template;
            this.is_selected = ko.computed(function () {
                return this === selected();
            }, this);
        };

        function EnrollViewModel(params) {

            var viewModel = {
                step_template: ko.observable('view-step-account'), //account'),  
                is_email_verfied: ko.observable(false),
                is_email_error: ko.observable(false),
                is_verify_error: ko.observable(false),
                is_pkselect_error: ko.observable(false),
                is_pwd_error: ko.observable(false),
                is_pwd_verify_error: ko.observable(false),
                is_account_name_error: ko.observable(false),
                email_address: ko.observable(''),
                verification_code: ko.observable(''),
                public_key_type: ko.observable(''),
                public_key: ko.observable(''),
                prvkey_password: ko.observable(''),
                prvkey_verify_password: ko.observable(''),
                encrypted_private_key: ko.observable(''),
                certificate: ko.observable(''),
                ppki_type: ko.observable(''),
                ppki_bits: ko.observable(''),
                sign_algo: ko.observable(''),
                account_name: ko.observable(''),
                selected_step: ko.observable(),
                steps: null,
                enroll_mode: ko.observable(params.mode), // default is 1 email based

                send_email: function () {
                    try {
                        var self = this;

                        this.is_email_error(false);

                        var ck_email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                        var email = $.trim(this.email_address());
                        if (!email) {
                            this.is_email_error(true);
                            return;
                        }
                        if (email.indexOf('@') == -1 || email.indexOf('.') == -1) {
                            this.is_email_error(true);
                            return;
                        }

                        email = email.toLowerCase();

                        if (!ck_email.test(email)) {
                            this.is_email_error(true);
                            return;
                        }

                        // invoke blockui
                        uihandler.blockwin();

                        //send the email
                        var data = {
                            email: email
                        };
                        moisrvc.send("sendmail", data,
                            function () {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                // email successfully sent
                                self.step_template("view-step-verify-email");
                                self.selected_step(self.steps()[1]);
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                streembit.notify.error("Error in sending email %j", err );
                            }
                        );
                    }
                    catch (err) {
                        streembit.notify.error("Error in sending email %j", err);
                    }
                },

                verify_email: function () {
                    try {
                        var self = this;

                        this.is_verify_error(false);

                        var code = $.trim(this.verification_code());
                        if (!code) {
                            this.is_verify_error(true);
                            return;
                        }

                        var email = $.trim(this.email_address());
                        email = email.toLowerCase();

                        var account = $.trim(this.account_name());
                        if (!account) {
                            throw new Error("the account name is missing")
                        }

                        // invoke blockui
                        uihandler.blockwin();

                        //send the email
                        var data = {
                            email: email,
                            enrollcode: code,
                            account: account
                        };
                        moisrvc.send("verifycode", data,
                            function () {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                // email successfully sent
                                self.step_template("view-step-genpen");
                                self.selected_step(self.steps()[2]);
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                streembit.notify.error("Error in verifying the enroll code", err);
                            }
                        );
                    }
                    catch (err) {
                        streembit.notify.error("Error in verifying the enroll code %j", err);
                    }
                },

                generate_ecckey: function (curve) {
                    if (curve != "secp256k1" && curve != "secp256r1" && curve != "secp384r1") {
                        throw new Error("Invalid EC curve");
                    }
                    var ecKeypair = jsrsa.KEYUTIL.generateKeypair("EC", curve);
                    this.ppki_type("EC");
                    this.ppki_bits(curve);
                    return ecKeypair;
                },

                generate_rsakey: function (algo) {
                    try {
                        var bits = parseInt(algo.substring(3));
                        if (bits != 1024 && bits != 2048) {
                            throw new Error("Invalid RSA bits. RSA must be 1024 or 2048 bits");
                        }

                        var rsaKeypair = jsrsa.KEYUTIL.generateKeypair("RSA", bits);
                        this.ppki_type("RSA");
                        this.ppki_bits(bits);
                        return rsaKeypair;
                    }
                    catch (err) {
                        throw err;
                    }
                },

                validate_password: function (val) {
                    if (!val) {
                        return false;
                    }
                    if (val.length < 8) {
                        return false;
                    }
                    if (val.indexOf(' ') > -1) {
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
                        return false;
                    }

                    var ck_nums = /\d/;
                    if (!ck_nums.test(val)) {
                        return false;
                    }

                    valid = false;
                    for (var i = 0; i < val.length; i++) {
                        var asciicode = val.charCodeAt(i);
                        if ((asciicode > 32 && asciicode < 48) ||
                            (asciicode > 57 && asciicode < 65) ||
                            (asciicode > 90 && asciicode < 97) ||
                            (asciicode > 122 && asciicode < 127) ||
                            asciicode == 163) {
                            valid = true;
                            break;
                        }
                    }
                    if (!valid) {
                        return false;
                    }

                    return true;
                },

                generate_pen: function () {
                    try {
                        var self = this;

                        var algo = this.public_key_type();
                        if (!algo) {
                            return this.is_pkselect_error(true);
                        }

                        this.is_pkselect_error(false);

                        var password = $.trim(this.prvkey_password());
                        if (!password) {
                            return this.is_pwd_error(true);
                        }
                        var valid = this.validate_password(password);
                        if (!valid) {
                            return this.is_pwd_error(true);
                        }
                        this.is_pwd_error(false);

                        var verpassword = $.trim(this.prvkey_verify_password());
                        if (!verpassword) {
                            return this.is_pwd_verify_error(true);
                        }
                        this.is_pwd_verify_error(false);

                        var enrollcode = $.trim(this.verification_code());

                        // invoke blockui
                        uihandler.blockwin();

                        user.create_key(password, function (err) {
                            if (err) {
                                uihandler.unblockwin();
                                return streembit.notify.error("Error in saving the certificate, PKBDF2 password generation, ", err);
                            }
                            
                            try {
                                //debugger;
                                //var action;
                                var certdetails = { "type": "x509", "bits": 0, "publickey": 0, "algo": 0 };
                                var email = $.trim(self.email_address()).toLowerCase();
                                var pubkey = user.public_key;

                                //if (algo == "ppkisecp256k1") {
                                //    // the user object created the publickey
                                //    pubkey = user.public_key;     
                                //    certdetails.publickey = pubkey;
                                //    action = "saveppkikey";
                                //}
                                //else {
                                    // generate certificate request
                                var isrsa = algo.indexOf("RSA") > -1 ? true : false;
                                var pkey;
                                if (isrsa) {
                                    pkey = self.generate_rsakey(algo);
                                }
                                else {
                                    pkey = self.generate_ecckey(algo);
                                }

                                if (!pkey || !pkey.prvKeyObj) {
                                    throw new Error("unexpeted error in generating key pair");
                                }

                                var pkbdf2pwd = user.pkbdf2_password_hash;
                                var encprvk = jsrsa.KEYUTIL.getPEM(pkey.prvKeyObj, "PKCS8PRV", pkbdf2pwd);
                                self.encrypted_private_key(encprvk);

                                certdetails.publickey = jsrsa.KEYUTIL.getPEM(pkey.pubKeyObj);

                                certdetails.algo = self.ppki_type();
                                certdetails.bits = self.ppki_bits();

                                var mode = self.enroll_mode();

                                var data = {
                                    enrollcode: enrollcode,
                                    mode: mode, // refers to email based enrollment process
                                    email: email,
                                    publickey: pubkey,
                                    algo: algo,
                                    cert: certdetails,
                                    isfoundation: true
                                };

                                moisrvc.send("createcert", data,
                                    function (result) {
                                        // unblock when ajax activity stops 
                                        uihandler.unblockwin();

                                        if (!result || result.status != 0) {
                                            return streembit.notify.error("invalid certificate save result value returned from the server");
                                        }

                                        if (result.cert){
                                            self.certificate(result.cert);
                                        }

                                        self.public_key(pubkey);

                                        // email successfully sent
                                        self.step_template("view-step-storepen");
                                        self.selected_step(self.steps()[4]);
                                    },
                                    function (err) {
                                        // unblock when ajax activity stops 
                                        uihandler.unblockwin();
                                        streembit.notify.error("Error in saving the certificate", err);
                                    }
                                );

                            }
                            catch (err) {
                                uihandler.unblockwin();
                                streembit.notify.error("Error in generating PEN", err);
                            }  
                        });                       

                    }
                    catch (err) {
                        streembit.notify.error("Error in generating PEN %j", err);
                    }
                },

                save_certificate: function () {
                    //debugger;          
                    try {
                        var self = this;

                        // save to local database via the user object
                        var account = $.trim(this.account_name());
                        if (!account) {
                            return this.is_account_name_error(true);
                        }
                        this.is_account_name_error(false);

                        var email = $.trim(this.email_address()).toLowerCase();
                        var encrprivkey = this.encrypted_private_key();
                        var certificate = this.certificate();
                        user.save_account(account, certificate, encrprivkey, email, function (err) {
                            if (err) {
                                return streembit.notify.error(err.message);
                            }

                            self.step_template("view-step-complete");
                            self.selected_step(self.steps()[5]);
                            
                        });
                    }
                    catch (err) {
                        streembit.notify.error(err.message);
                    }
                },

                get_account: function () {
                    //debugger;          
                    try {
                        var self = this;

                        var account = $.trim(this.account_name());
                        if (!account || account.length < 4) {
                            return this.is_account_name_error(true);
                        }
                        this.is_account_name_error(false);

                        self.step_template("view-step-email");
                        self.selected_step(self.steps()[1]);
                    }
                    catch (err) {
                        streembit.notify.error("Error in defining account %s", err.message);
                    }
                },

                navigate_indoor: function () {        
                    appevents.send(appevents.TYPES.ONUSRKEYINIT);
                    appevents.navigate("dashboard");
                },

                stepnav: function (item, p, r) {
                    var current = viewModel.selected_step();
                    if (current.id > item.id) {
                        viewModel.step_template(item.template);
                        viewModel.selected_step(viewModel.steps()[item.id-1]);
                    }
                }
            };

            viewModel.steps = ko.observableArray([
                new EnrollStep(1, 'Indoor Presence', 'view-step-account', viewModel.selected_step),
                new EnrollStep(2, 'Send Email', 'view-step-email', viewModel.selected_step),
                new EnrollStep(3, 'Verify Email', "view-step-verify-email", viewModel.selected_step),
                new EnrollStep(4, 'PCN & PEN', "view-step-genpen", viewModel.selected_step),               
                new EnrollStep(5, 'Save PCN & PEN', "view-step-storepen", viewModel.selected_step),
                new EnrollStep(6, 'Complete', "view-step-complete", viewModel.selected_step)
            ]);           

            //inialize to the first step
            viewModel.selected_step(viewModel.steps()[0]);

            return viewModel;

        }

        return {
            viewModel: EnrollViewModel,
            template: template
        };
    });
}());
