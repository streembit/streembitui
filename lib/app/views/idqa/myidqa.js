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

'use strict';

(function () {

    define(
        ['appsrvc', 'user', 'definitions', 'jsrsasign', 'uihandler', 'moisrvc', './view.html!text'],
        function (appsrvc, user, defs, jsrsa, uihandler, moisrvc, template) {

            //var idqadef = [
            //    {
            //    "category": "Personal Assets Protection"
            //    }
            //];

            var idqadef = [
                {
                    "category": "Personal Assets Protection",
                    "scoreitems": 
                        [
                            {
                                score: 0,
                                content: "The identity is not owned but is simply a username created by the user for access to a particular application or set of applications."
                            },
                            {
                                score: 1,
                                content: "The identity was established, and is owned, by a principal relying party, such as an employer, strictly for use in the principal relying party's set of applications and network."
                            },
                            {
                                score: 2,
                                content: "The identity was established, and is owned, by an independent enrollment authority only for use in the network of one principal relying party, such as an employer."
                            },
                            {
                                score: 3,
                                content: "The identity was established, and is owned, by an independent enrollment authority principally for the benefit of one principal relying party but is available for use elsewhere, or was established, and is owned, by a government entity other than an intelligence agency; is characterized as user-centric single-sign-on with ownership not specified."
                            },
                            {
                                score: 4,
                                content: "Ownership of the identity is explicitly that of a bank or financial services firm, for use in the accounts with an available cash balance, with the bank or financial services firm as the sole relying party OR the credential is explicitly owned by the subject. The Attestation Officer may use the additive-score method by adding this values associated with this conditions when true."
                            },
                            {
                                score: 5,
                                content: "The identity is owned by a bank or financial services firm, for use in the accounts with an availabale cash balance and also for use in applications and networks of multiple relying parties."
                            },
                            {
                                score: 7,
                                content: "Ownership of the identity is explicitly that of the subject, for use in applications and networks of multiple relying parties."
                            },
                            {
                                score: 9,
                                content: "The ownership of the identity is explicitly that of the subject, for use in applications and networks of multiple relying parties, at least one of which is a bank or other financial services firm and provides access to an account with an available cash balance."
                            }
                        ]                    
                },
                {
                    "category": "Quality of Enrollment Practices",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No enrollment was performed."
                        },
                        {
                            score: 1,
                            content: "The Basic Certificate or other procedure that consists only of simple validation of subject's control of a particular email address."
                        },
                        {
                            score: 2,
                            content: "A cookie is placed in the subject's computer; MAC and IP addresses of user's computer are recorded. The certificate is sent to the user's information appliance or wallet. Identity validation session, during which subject is asked a series of questions including national identity number (e.g., SSN in the United States), address of primary residence, driver's license number, and answers to a series of questions about personal history." 
                        },
                        {
                            score: 3,
                            content: "Phone number based validation. Automated system places the call and an automated voice prompt asks the subject to look for a control number on the computer screen and enter it into the telephone handset."
                        },
                        {
                            score: 4,
                            content: "Same as preceding, phone number based validation with voice recording."
                        },
                        {
                            score: 5,
                            content: "Video call based identity verification."
                        },
                        {
                            score: 6,
                            content: "Remotely supervised face-to-face enrollment. "
                        },
                        {
                            score: 7,
                            content: "Face-to-face enrollment (Digital Birth Certificate)"
                        },
                        {
                            score: 8,
                            content: "Extended Digital Birth Certificate"
                        },
                        {
                            score: 9,
                            content: "Appointment with an Attestation Officer. The private key is embedded into a fingerprint-enabled USB token, smart card, wireless token, or other multi-factor identity device."
                        }
                    ]
                },
                {
                    "category": "Quality of Means of Assertion",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "Certificate stands by itself and is not associated with an identity from an identity assertion network"
                        },
                        {
                            score: 1,
                            content: "Assertable only as a username in a single organizational network"
                        },
                        {
                            score: 2,
                            content: "Assertable only on a single online resource, such as a web site"
                        },
                        {
                            score: 3,
                            content: "Assertable only through a proprietary group of online resources, such as a group of related Web sites or a federated identity network"
                        },
                        {
                            score: 4,
                            content: "Assertable through OpenID, CardSpace, or Liberty Alliance"
                        },
                        {
                            score: 5,
                            content: "Assertable through I-Name"
                        },
                        {
                            score: 8,
                            content: "Assertable through multiple identity assertion networks"
                        },
                        {
                            score: 9,
                            content: "Assertable through all current identity assertion networks"
                        }
                    ]
                },
                {
                    "category": "Quality of Authoritative Attestation",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No certification, no independent IdP."
                        },
                        {
                            score: 1,
                            content: "Identity provided by IdP using X.509v3 certificate after verification-code-do-email procedure or after a transaction-based process with subject."
                        },
                        {
                            score: 2,
                            content: "Identity provided by and attested by a WebTrust Audited General Purpose Certification Authority via 'Level 2' X.509v3 certificate."
                        },
                        {
                            score: 4,
                            content: "Identity provided by and attested by a WebTrust Audited General Purpose Certification Authority via 'Level 3' X.509v3 certificate."
                        },
                        {
                            score: 5,
                            content: "Identity provided by and attested by a WebTrust Audited General Purpose Certification Authority via 'Level 4' X.509v3 certificate."
                        },
                        {
                            score: 7,
                            content: "Identity provided by and attested by a WebTrust Audited General Purpose Certification Authority with duly constituted public authority via 1024 bit X.509v3 certificate."
                        },
                        {
                            score: 8,
                            content: "Identity provided by and attested by a WebTrust Audited General Purpose Certification Authority with duly constituted public authority via 2048 bit X.509v3 certificate."
                        }
                    ]
                },
                {
                    "category": "Quality of Other Attestations",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No score."
                        },
                        {
                            score: 1,
                            content: "Attestation from colleagues with IDQA scores totaling 200."
                        },
                        {
                            score: 2,
                            content: "Attestation of an administrator of an established school system in which the subject is enrolled OR More than 50 positive feedbacks and over 97% positive feedback rating on subject-owned eBay ID; ownership verified by Attestation Officer."
                        },
                        {
                            score: 4,
                            content: "Attestation from colleagues with IDQA scores totaling 300 plus attestation from employer or professional association."
                        },
                        {
                            score: 5,
                            content: "Attestation provided to Attestation Officer from full-time employer of two or more years Identity."
                        }
                    ]
                },
                {
                    "category": "Quality of the Credential",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No quality."
                        },
                        {
                            score: 1,
                            content: "Private key is stored on the hard drive of a network-connected computer running a personal computer operating system without protection from intrusion."
                        },
                        {
                            score: 2,
                            content: "Private key is stored on the hard drive of a network-connected computer running a personal computer operating system with an intrusion prevention mechanism whose quality has been verified by the Attestation Officer, or in a verified 'sandbox' area on a device, such as a mobile phone, but without isolation from the device's general operating system."
                        },
                        {
                            score: 3,
                            content: "Private key is stored in a verified isolated device with a separate operating environment on a device such as a mobile phone, isolated from the device's general operating system, as verified by the Attestation Officer."
                        },
                        {
                            score: 4,
                            content: "Private key is stored in a verified isolated device verified by the Attestation Officer. Use of the private key is enabled by input of passcode from the keypad of the mobile device."
                        },
                        {
                            score: 5,
                            content: "Private key is stored in a verified isolated device verified by the Attestation Officer. Use of the private key is enabled by input of passcode or biometric on the isolated portion of the device and not from the keypad or biometric input of the mobile device."
                        },
                        {
                            score: 6,
                            content: "Private key is stored in a verified isolated device with a separate operating system that meets the 'Osmium' standard for isolated cryptographic operating systems or an equivalent standard for HSM devices on a device such as a mobile phone, isolated from the device's general operating system."
                        },
                        {
                            score: 7,
                            content: "In addition to the previous, the isolated device has a display, circuitry, and Osmium-grade software that is suitable for image verification of a remote facility for authenticity, and a system in which the verification image exists only in encrypted form, with all cleartext versions of the image having been destroyed."
                        },
                        {
                            score: 8,
                            content: "This score can be reached if incrementation warrants, with incrementation by one if multiple key pairs that are separate from an archived foundational private key are used in the establishment and operation of this identity"
                        },
                        {
                            score: 9,
                            content: "In addition, the CC Code is incremented by two if separate keys pairs are used for signing, authentication, and encryption, with different key pairs used for different types of token usage (single factor, two factor, three factor, four factor), all of which are bound to an archived foundational private key. "
                        }
                    ]
                },
                {   
                    "category": "Degree of Assumption of Liability",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No assumption of liability by any party"
                        },
                        {
                            score: 1,
                            content: "Attestation Officer assumes at least $5, 000 liability for the integrity of the enrollment process."
                        },
                        {
                            score: 2,
                            content: "The enrollment was notarial."
                        },
                        {
                            score: 3,
                            content: "The enrollment was notarial, and the subject assumes at least $10,000 liability for acts of fraudulent enrollment."
                        },
                        {
                            score: 4,
                            content: "The enrollment was notarial, and the subject assumes at least $5,000 bonded or insured liability for acts of fraudulent enrollment."
                        },
                        {
                            score: 5,
                            content: "The enrollment was notarial; the subject, enrolling notary, and Attestation Officer (if different from enrolling notary) each assumes at least $5, 000 bonded or insured liability for acts of fraudulent enrollment."
                        },
                        {
                            score: 6,
                            content: "As the previous, but it assumes at least $25,000 bonded or insured liability for acts of fraudulent enrollment; and the subject assumes at least $100, 000 liability"
                        },
                        {
                            score: 7,
                            content: "Assumes at least $25,000 bonded or insured liability for acts of fraudulent enrollment; and the subject assumes at least $1 million liability"
                        },
                        {
                            score: 8,
                            content: "Attestation Officer verifies initially, and at least yearly thereafter, that the subject of the identity certificate carries a bond of $5 million or more that insures the identity of subject and also against fraud in all transactions and events that the subject signs with the identity credential or any derivative credential or certificate." 
                        },
                        {
                            score: 9,
                            content: "Subject is bonded and the bond applies to any instance where the credential is misused; subject assumes liability for any and all misuse of the credential.Bonding events, including commitments regarding the use of the bond, are signed by the bond issuer and are updated at each bonding or bond usage event, and are made available in an authenticated online space to relying parties."
                        }
                    ]
                },
                {
                    "category": "Reputation of the Credential",
                    "scoreitems":
                    [
                        {
                            score: 0,
                            content: "No score."
                        },
                        {
                            score: "1-9",
                            content: "Number of years of usage times number of times used divided by 500, to a maximum of 9. The Attestation Officer may adjust this score if there is evidence that the credential has been shared."
                        }
                    ]
                }
            ];

            const default_idqascores = [4, 2, 2, 1, 0, 2, 0, 0];

            const max_score = 72;

            function IDQAVm() {

                var viewModel = {

                    categories: ko.observableArray(idqadef),
                    idqascores: [],
                    idqasum: ko.observable(0),
                    score_percent: ko.observable(0),

                    init: function (callback) {
                        try {           
                            //debugger;
                            if (appsrvc.idqascore && appsrvc.idqascore.scorearr && Array.isArray(appsrvc.idqascore.scorearr)) {
                                viewModel.idqascores = appsrvc.idqascore.scorearr;
                            }

                            var count = 0;
                            for (var i = 0; i < this.categories().length; i++) {
                                this.categories()[i].id = count++;
                                this.categories()[i].scoreitems.forEach(function (item) {
                                    item.isavailable = ko.observable(false);
                                    item.iscurrentscore = ko.observable(0);
                                    if (viewModel.idqascores[i] == item.score) {
                                        item.iscurrentscore(true);
                                    }
                                    if (item.score > 0 && item.score > viewModel.idqascores[i]) {
                                        item.isavailable(true);
                                    }
                                });
                            }

                            var sum = 0;
                            for (var i = 0; i < viewModel.idqascores.length; i++) {
                                sum += viewModel.idqascores[i];
                            }
                            viewModel.idqasum(sum);
                            viewModel.score_percent(parseInt((sum / max_score) * 100));

                            //
                        }
                        catch (err) {
                            doorclient.notify.error("Certificates init error: %j", err);
                        }
                    },

                    on_item_click: function (item, e) {
                        var element = e.currentTarget;
                        $('.glyphicon', element)
                            .toggleClass('glyphicon-chevron-right')
                            .toggleClass('glyphicon-chevron-down');
                        
                    },

                    upgrade: function (item) {
                        var reply = confirm("Would you like to upgrade to this level your IDQA score?");
                        if (reply) {
                            alert("Currently the upgrade to this level is not available. Please contact your service provider for more information about how you can improve your IDQA score!");
                        }
                    },

                    getdata: function () {
                        try {
                            var self = this;

                            this.certificates([]);

                            // invoke blockui
                            uihandler.blockwin();

                            moisrvc.sendauth("getidqa", {},
                                function (ret) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();

                                    if (!ret || ret.status != 0) {
                                        return doorclient.notify.error("Error in getting file cabinets");
                                    }

                                    if (ret.result) {
                                        var index = 1;
                                        var collection = [];
                                        ret.result.forEach((item) => {
                                            var cert = new CertItem(index++, item);
                                            collection.push(cert);
                                        });

                                        self.certificates(collection);
                                    }
                                },
                                function (err) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();
                                    doorclient.notify.error("Error in getting file cabinets", err);
                                }
                            );
                        }
                        catch (e) {
                            uihandler.unblockwin();
                            doorclient.notify.error("Error in getting file cabinets %", e.message);
                        }
                    }        
                };

                viewModel.init();

                setTimeout(function () {
                    if ($.fn.easyPieChart) {

                        $('.easy-pie-chart').each(function () {
                            var $this = $(this),
                                barColor = $this.css('color') || $this.data('pie-color'),
                                trackColor = $this.data('pie-track-color') || 'rgba(0,0,0,0.04)',
                                size = parseInt($this.data('pie-size')) || 25;

                            $this.easyPieChart({

                                barColor: barColor,
                                trackColor: trackColor,
                                scaleColor: false,
                                lineCap: 'butt',
                                lineWidth: parseInt(size / 8.5),
                                animate: 1500,
                                rotate: -90,
                                size: size,
                                onStep: function (from, to, percent) {
                                    $(this.el).find('.percent').text(Math.round(percent));
                                }

                            });

                            $this.show();

                            $this = null;
                        });

                    } // end if
                },
                1000);

                return viewModel;
            }       

            return {
                viewModel: IDQAVm,
                template: template
            };
        });

}());



