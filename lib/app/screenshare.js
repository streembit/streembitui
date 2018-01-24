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
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {

    var uuid = require("uuid");
    var webrtcfile = require("webrtcfile");
    var peercomm = require("peercomm");
    var appevents = require("appevents");

    function ScreenShare() {

        var handler = {

            dispose: function () {
            },

            oncomplete: function (hash) {
                // complete the task
                appevents.dispatch("on-task-event", "complete", "send", hash);
            },

            onerror: function (taskid, err, param) {
                try {
                    appevents.error( 0x8202, err, param);
                    appevents.dispatch("on-task-event", "error", "send", taskid, err);
                }
                catch (err) {
                    streembit.notify.error("Send  file VM onerror: %j", err, true)
                }
            },

            onsend: function (hash, value) {
                console.log("onsend value: " + value);
                appevents.dispatch("on-task-event", "update", "send", hash, value);
            },

            offer: function (contact, taskid, onreply, onerror, callback) {  
                peercomm.ping(contact, true, 10000)
                .then(
                    function () {
                        return peercomm.get_contact_session(contact);
                    }
                ).then(
                    function () {
                        peercomm.offer_sharescreen(contact, taskid, onreply, onerror);
                    }
               )
               .catch(function (err) {
                   onerror(err);
               });
            },

            run: function (contact, taskid, callback) {
                return new Promise(function (resolve, reject) {

                    try {

                        if (!contact || !taskid) {
                            return reject("invalid screen share run parameters");
                        }

                        function on_sharescreen_error(err) {
                            reject(err);
                            appevents.dispatch("on-task-event", "close", "send", taskid);
                        }

                        function on_sharescreen_reply(isaccepted) {
                            if (isaccepted == true) {
                                resolve();
                            }
                            else if (isaccepted == false) {
                                streembit.notify.info("Contact " + contact.name + " declined the share screen request");
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                            }
                            else {
                                reject("unable to receive a valid reply from the contact for the screen sharing offer");
                            }
                        }
                        
                        appevents.dispatch("on-task-event", "add", {
                            proc: "info",
                            type: "screen",
                            mode: "send",
                            taskid: taskid,
                            contact: contact,
                            showconnect: true
                        });

                        handler.offer(contact, taskid, on_sharescreen_reply, on_sharescreen_error, function () {
                            resolve();
                        });

                    }
                    catch (e) {
                        reject(err);
                    }
                });
                
            }
        };

        return handler;
    }

    module.exports = ScreenShare;

})();
