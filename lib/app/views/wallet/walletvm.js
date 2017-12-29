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
        ['i18next', 'appevents', 'settings', './wallet.html!text'], 
        function (i18next, appevents, settings, template) {

            function WalletModel(params) {
                let self = this;
                self.onBcEvent = function (payload, event) {
                    console.log(payload)
                }
                self.restore = function(){
                    var content = $("#restore-file-template").html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Restore",
                        closeButton: true,
                    });
                    box.init(function () {
                        $(".modal-header").css({"padding": "16px" , "background": "#fff"});
                    });
                }
                self.deleteItem = function(){
                    var content = $('#delete-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Are you sure ?",
                        closeButton: true,
                    });
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"});
                    });
                }
                self.backupItem = function(){
                    var content = $('#backup-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Backup",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"});
                    })
                }
                self.passwordItem = function(){
                    var content = $('#password-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Change Password",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                    })
                }
                self.seedItem = function(){
                    var content = $('#seed-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Enter Password",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                       $(".modal-content").css({"width": "300px", "margin": "0 auto"}); 
                    })
                }
                self.privateKeysItem = function(){
                    var content = $('#privateKey-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Private Keys",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                    })
                }
                self.historyItem = function(){
                    var content = $('#history-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "History",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                    })
                }
                self.contactItem = function(){
                    var content = $('#createcontract-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Create Smart Contract",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                    })
                }
                self.preferencesItem = function(){
                    var content = $('#preferences-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Preferences",
                        closeButton: true,
                    })
                    box.init(function(){
                       $(".modal-header").css({"padding": "16px" , "background": "#fff"}); 
                    })
                }
                self.networkItem = function(){
                    var content = $('#network-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Network",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.signMessageItem = function(){
                    var content = $('#signmessage-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Sign/verify message",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                    
                }
                self.encryptItem = function(){
                    var content = $('#encrypt-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Encrypt",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.transactionText = function(){
                    var content = $('#transfromtext-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "From Text",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.transactionBlockchain = function(){
                    var content = $('#transblockchain-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "From Blockchain",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.transactionQRCode = function(){
                    var content = $('#transcode-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "From QR code",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.helpDocItem = function(){
                    var content = $('#help-item-template').html();
                    var box = bootbox.dialog({
                        message: content,
                        title: "Help",
                        closeButton: true,
                    })
                    box.init(function(){
                        $(".modal-header").css({"padding": "16px", "background": "#fff"});
                    })
                }
                self.dispose = function () {
                    appevents.removeSignal("on-bc-event", self.onBcEvent);
                };
                
                this.init = function () {
                    var components = ['overview', 'sendmoney', 'receivemoney', 'transactions', 'restore', 'delete', 'backup', 'password', 'seed', 'privateKey', 'history', 'createcontract', 'preferences', 'network', 'signmessage', 'encrypt', 'transfromtext', 'transblockchain', 'transcode', 'helpdoc'];
                    $.each(components, (idx, com) => {
                        if (!ko.components.isRegistered(com)) {
                            ko.components.register(com, { require: `./lib/app/views/wallet/${com}/${com}`});
                        
                        }
                    });

                    appevents.addListener("on-bc-event", self.onBcEvent);
                };
                    
                this.init();
            }
            return {
                viewModel: WalletModel,
                template: template
            };

    });
}());
