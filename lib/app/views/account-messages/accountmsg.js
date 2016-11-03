/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    define(
        ['knockout', 'user', 'appsrvc', 'peercomm', 'definitions', 'contactlist', 'appevents', './accountmsg.html!text'],
        function (ko, user, appsrvc, peercomm, defs, contactlist, appevents, template) {

        function AccountMessagesVm(params) {
            var viewModel = {
                messages: ko.observableArray([]),
                username: ko.observable(appsrvc.username),

                init: function (msgs) {
                    var self = this;
                    if (!msgs || !Array.isArray(msgs) || !msgs.length) { return }

                    msgs.forEach(function (msg) {
                        var key = msg.key;
                        var message = msg.message;
                        self.add_message(key, message);
                    });
                },

                add_message: function (key, message) {
                    try {
                        if (!message || !message.data) return;

                        var proc = "handle_" + message.data.message_type + "_message";
                        viewModel[proc](key, message);
                    }
                    catch (err) {
                        streembit.notify.error("Add message error %j", err, true);
                    }
                },

                handle_declinecontact_message: function (key, message) {
                    var msgtype = message.data.message_type;
                    if (msgtype != defs.MSG_DECLINECONTACT)
                        return;

                    var sender = message.iss;
                    appevents.dispatch("on-netreceive-addcontact-denied", sender);
                },

                handle_addcontact_message: function (key, message) {
                    var msgtype = message.data.message_type;
                    if (msgtype != defs.MSG_ADDCONTACT)
                        return;

                    //  check if the contact exists already, don't show 
                    //  the message if thecontact is alredy accepted
                    if (contactlist.exists(message.iss)) {
                        return;
                    }

                    var template_name = "account-" + msgtype + "-message";
                    var fdate = "-";
                    if (message.iat) {
                        var date = new Date(message.iat * 1000);
                        fdate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                    }
                    var msgobj = { template: template_name, key: key, sender: message.iss, time: fdate, data: {} };
                    viewModel.messages.push(msgobj);
                },

                handle_text_message: function (key, message) {
                    var msgtype = message.data.message_type;
                    if (msgtype != defs.MSG_TEXT)
                        return;

                    var sender_ecdh = message.data.send_ecdh_public;
                    var rcpt_ecdh = message.data.rcpt_ecdh_public;
                    if (!sender_ecdh || !rcpt_ecdh)
                        return;

                    var ecdhkeys = streembit.User.ecdhkeys;
                    // get the user ecdh key that was used to encrypt the message
                    var ecdh_public_key = null;
                    var ecdh_private_key = null;
                    for (var i = 0; i < ecdhkeys.length; i++) {
                        if (ecdhkeys[i].ecdh_public_key == rcpt_ecdh) {
                            ecdh_public_key = ecdhkeys[i].ecdh_public_key;
                            ecdh_private_key = ecdhkeys[i].ecdh_private_key;
                            break;
                        }
                    }

                    if (!ecdh_public_key) {
                        streembit.notify.error("Couldn't find sender %s public key to verify the message", sender);
                        return;
                    }

                    if (!ecdh_private_key) {
                        streembit.notify.error("Couldn't populate the user private key to decrypt the message");
                        return;
                    }

                    var jwe_input = message.data.cipher;
                    var plain_text = streembit.Message.decrypt_ecdh(ecdh_private_key, ecdh_public_key, sender_ecdh, jwe_input);
                    if (!plain_text) {
                        //TODO report
                        return;
                    }

                    var dataobj = JSON.parse(plain_text);
                    if (!dataobj) {
                        //TODO report
                        return;
                    }

                    var template_name = "account-text-message";

                    var fdate = "-";
                    if (message.iat) {
                        var date = new Date(message.iat * 1000);
                        fdate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
                    }
                    var msgobj = { template: template_name, key: key, sender: message.iss, time: fdate, data: dataobj };
                    viewModel.messages.push(msgobj);
                },                

                deletemsg: function (message) {
                    try {
                        var key = message.key;
                        if (!key) return;
                        var arr = key.split("/");
                        if (!arr || !arr.length || arr.length < 3) return;

                        var msgid = arr[2];
                        peercomm.delete_message(msgid, function (err) {
                            if (err) {
                                return streembit.notify.error("Error in deleting message. %j", err, true)
                            }

                            viewModel.messages.remove(function (item) {
                                return item.key && item.key == message.key;
                            });
                        });
                    }
                    catch (err) {
                        streembit.notify.error("Delete message error: %j", err, true);
                    }
                },

                accept_addcontact: function (message) {
                    var account = message.sender;
                    appevents.dispatch("offline-addcontact-accepted", account);
                    viewModel.deletemsg(message);
                },

                decline_addcontact: function (message) {
                    appevents.dispatch("offline-addcontact-declined", account);
                    viewModel.deletemsg(message);
                }
            };

            if (params) {
                viewModel.init(params);
            }

            return viewModel;
        }           

        return {
            viewModel: AccountMessagesVm,
            template: template
        };
    });

}());



