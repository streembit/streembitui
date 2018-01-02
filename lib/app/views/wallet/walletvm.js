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

                this.onBcEvent = function (payload, event) {  
                    console.log(payload)
                }

                this.restore = function(){
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

                this.deleteItem = function(){
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

                this.backupItem = function(){
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

                this.passwordItem = function(){
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

                this.seedItem = function(){
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

                this.privateKeysItem = function(){
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

                this.historyItem = function(){
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

                this.contactItem = function(){
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

                this.preferencesItem = function(){
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

                this.networkItem = function(){
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

                this.signMessageItem = function(){
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

                this.encryptItem = function(){
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

                this.transactionText = function(){
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

                this.transactionBlockchain = function(){
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

                this.transactionQRCode = function(){
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

                this.helpDocItem = function(){
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

                this.dispose = function () {
                    appevents.removeSignal("on-bc-event", this.onBcEvent);
                };
                
                this.init = function () {
                    var components = ['overview', 'sendmoney', 'receivemoney', 'transactions', 'restore', 'delete', 'backup', 'password', 'seed', 'privateKey', 'history', 'createcontract', 'preferences', 'network', 'signmessage', 'encrypt', 'transfromtext', 'transblockchain', 'transcode', 'helpdoc'];
                    $.each(components, (idx, com) => {
                        if (!ko.components.isRegistered(com)) {
                            ko.components.register(com, { require: `./lib/app/views/wallet/${com}/${com}`});
                        
                        }
                    });

                    appevents.addListener("on-bc-event", this.onBcEvent);
                };
                    
                this.init();
            }
            return {
                viewModel: WalletModel,
                template: template
            };

    });
}());
