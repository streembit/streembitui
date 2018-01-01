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
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {
    define(
        ['i18next', 'definitions', 'appevents', './sendmoney.html!text'],
        function (i18next, definitions, appevents, template) {

            function SendMoneyModel(params) {

                var viewModel = {
                    payBit: ko.observable(),
                    recipientAddress: ko.observable(),
                    txnAmount: ko.observable('0.000'),
                    txnFee: ko.observable('0.0002'),
                    reqReplace: ko.observable(false),
                    // Errors report
                    errRecipient: ko.observable(false),
                    errTxtRecipient: ko.observable(''),
                    errAmount: ko.observable(false),
                    errTxtAmount: ko.observable(''),
                    errFees: ko.observable(false),
                    errTxtFees: ko.observable(''),
                    errSend: ko.observable(false),
                    // Validation rules
                    rxRecipient: /[a-z0-9]{30,44}/im,

                    clear: function () {
                        this.payBit(null);
                        this.recipientAddress('');
                        this.txnAmount(0.000);
                        this.txnFee(0.0002);
                        this.reqReplace(false);
                    },

                    send: function () {
                        var recipient = this.recipientAddress();
                        //TODO validate, must be a string, length > 0, length at least 30 and no longer than 44
                        if (!this.rxRecipient.test(recipient)) {
                            this.errRecipient(true);
                            this.errTxtRecipient(i18next.t('errmsg-wallet-send-recipient'));
                        } else {
                            this.errRecipient(false);
                            this.errTxtRecipient('');
                        }

                        var amount = parseFloat(this.txnAmount());
                        //TODO validate
                        if (isNaN(amount) || amount <= 0) {
                            this.errAmount(true);
                            this.errTxtAmount(i18next.t('errmsg-wallet-send-amount'));
                        } else {
                            this.errAmount(false);
                            this.errTxtAmount('');
                        }

                        // must multitply with 100,000,000, so same as the satoshis value
                        amount = amount * definitions.STREEMBITSMUL;

                        var fees = parseFloat(this.txnFee());
                        //TODO validate
                        if (isNaN(fees) || fees <= 0) {
                            this.errFees(true);
                            this.errTxtFees(i18next.t("errmsg-wallet-send-fees"));
                        } else {
                            this.errFees(false);
                            this.errTxtFees('');
                        }

                        if (this.errRecipient() === true || this.errAmount() === true || this.errFees() === true || typeof this.reqReplace() !== 'boolean') {
                            return;
                        }

                        // define a callback. The callback is required as the service maybe cannot send the transaction to the network
                        // due to network error etc. and we need a notification about that 
                        //TODO fill out the parameters
                        var payload = {
                            cmd: "send",
                            callback: this.sendComplete,
                            data: {
                                amount: amount,
                                recipient: recipient,
                                txnfee: fees,
                                replace: this.reqReplace
                            }
                        };

                        appevents.dispatch("on-bc-command", payload);

                        // TODO navigate to the main wallet tab (overview)
                        // there must be an event listener that will receive a notification once the 
                        // network has processed the send transaction i.e. the transaction was sent to the blockchain

                    },

                    sendComplete: function (err, result) {
                        console.log("the money send operation dispatched result: " + result.dispatched ? "SUCCESS" : "FAILED");
                    }
                };

                return viewModel;

            }

            return {
                viewModel: SendMoneyModel,
                template: template
            };

    });
}());
