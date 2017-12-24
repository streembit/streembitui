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
        ['definitions', 'appevents', './sendmoney.html!text'], 
        function (definitions, appevents, template) {

            function SendMoneyModel(params) {

                var viewModel = {
                    payBit: ko.observable(),
                    recipientAddress: ko.observable(0),
                    txnAmount: ko.observable(0),
                    txnFee: ko.observable(0),
                
                    clear: function () {
                        this.payBit(null);
                        this.recipientAddress('');
                        this.amountText(0);
                        this.txnFee(0);
                    },

                    send: function () {
                        var recipient = this.recipientAddress();
                        //TODO validate, must be a string, length > 0, length at least 30 and no longer than 44
                        if (!recipient) {
                            return;
                        }

                        var amount = parseFloat(this.txnAmount());
                        //TODO validate
                        if (!amount || isNaN(amount)) {
                            return;
                        }

                        // must mulitply with 100,000,000, so same as the satoshis value
                        amount = amount * definitions.STREEMBITSMUL;

                        var fees = parseFloat(this.txnFee());
                        //TODO validate
                        if (!fees || isNaN(fees)) {
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
                                txnfee: fees                                
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
