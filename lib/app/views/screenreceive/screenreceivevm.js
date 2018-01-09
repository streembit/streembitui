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
    define([ 'appevents', 'peercomm', 'webrtcscreen', 'webrtcaudio', './screen.html!text'],
        function ( appevents, peercomm, webrtcscreen, webrtcaudio, template) {
        function ScreenReceiveViewModel(params) {
            var vm = {
                stream: params.stream,
                contact: params.contact,
                taskid: params.taskid,
                contact_name: ko.observable(params.contact.name),
                ispeerhangup: false,
                isuserhangup: false,
                audiocall: 0,

                init: function () {
                    vm.audiocall = new webrtcaudio();
                    vm.audiocall.init(vm.contact, true);
                },

                dispose: function () {
                    appevents.removeSignal("on-cmd-hangup-call", vm.onPeerHangup);

                    try {
                        if (!vm.isuserhangup && !vm.ispeerhangup) {
                            peercomm.hangup_call(vm.contact);
                            if (vm.audiocall) {
                                vm.audiocall.hangup();
                            }
                        }
                    }
                    catch (e) { }

                    try {
                        if (!vm.isuserhangup && !vm.ispeerhangup) {
                            webrtcscreen.hangup();
                        }
                    }
                    catch (e) { }
                },

                hangup: function () {
                    vm.isuserhangup = true;
                    webrtcscreen.hangup();
                    if (vm.audiocall) {
                        vm.audiocall.hangup();
                    }
                    peercomm.hangup_call(vm.contact);
                    appevents.dispatch("display-view", "emptyview"); 
                },

                onPeerHangup: function () {
                    vm.ispeerhangup = true;
                    webrtcscreen.hangup();
                    if (vm.audiocall) {
                        vm.audiocall.hangup();
                    }
                    // navigate to the contact screen
                    appevents.dispatch("on-contact-selected", viewModel.contact);
                    streembit.notify.info("The call has been terminated by the contact");
                }
            };

            setTimeout(function () {
                var screenVideo = document.getElementById("screenvideo");
                screenVideo.srcObject = vm.stream;
            },
            500);

            appevents.addListener("on-cmd-hangup-call", vm.onPeerHangup);

            vm.init();

            return vm;
        }

        return {
            viewModel: ScreenReceiveViewModel,
            template: template
        };
    });
}());
