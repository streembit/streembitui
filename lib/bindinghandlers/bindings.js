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


    var progressctrl = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var max = allBindings.get('max');
            if (max && typeof max == "function") {
                element.max = max();
            }
        },
        update: function (element, valueAccessor, allBindings) {
            var val = ko.utils.unwrapObservable(valueAccessor());
            if (val) {
                element.value = val;
            }
        }
    };

    var utcdate = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            if (valueUnwrapped == undefined || valueUnwrapped == null) {
                $(element).text("");
            }
            else {
                var utc = new Date(valueUnwrapped).toUTCString();
                $(element).text(utc);
            }
        }
    }

    var localdate = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            if (valueUnwrapped == undefined || valueUnwrapped == null) {
                $(element).text("");
            }
            else {
                var date = new Date(valueUnwrapped);
                $(element).text(date.toLocaleDateString() + " " + date.toLocaleTimeString());
            }
        }
    }

    var isodate = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor(),
                allBindings = allBindingsAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            if (valueUnwrapped == undefined || valueUnwrapped == null) {
                $(element).text("");
            }
            else {
                var utc = new Date(valueUnwrapped).toISOString();
                $(element).text(utc);
            }
        }
    }


    var switchbtn = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).change(function () {
                var value = valueAccessor();
                value($(element).is(":checked"));
                viewModel.toggle();
            }).blur(function () {
                var value = valueAccessor();
                value($(element).is(":checked"));
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var value = valueAccessor();
            var valueUnwrapped = ko.utils.unwrapObservable(value);
            $(element).prop('checked', valueUnwrapped);
        }
    };

    var activitypanel = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            $(element).click(function (e) {
                var $this = $(this);

                if ($this.find('.badge').hasClass('bg-color-red')) {
                    $this.find('.badge').removeClassPrefix('bg-color-');
                    $this.find('.badge').text("0");
                }

                if (!$this.next('.ajax-dropdown').is(':visible')) {
                    $this.next('.ajax-dropdown').fadeIn(150);
                    $this.addClass('active');
                } else {
                    $this.next('.ajax-dropdown').fadeOut(150);
                    $this.removeClass('active');
                    viewModel.template("activity-start-template");
                    viewModel.activitycount(0);
                }

                $this = null;
                e.preventDefault();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        }
    };

    var fadeVisible = {
        init: function (element, valueAccessor) {
            $(element).toggle(ko.unwrap(valueAccessor()));
        },
        update: function (element, valueAccessor) {
            ko.unwrap(valueAccessor()) ? $(element).fadeIn() : $(element).fadeOut();
        }
    };

    var toolTip = {
        init: function(element, valueAccessor) {
            var local = ko.utils.unwrapObservable(valueAccessor()),
                options = {
                    placement: "right",
                    trigger: "hover"
                };

            ko.utils.extend(options, ko.bindingHandlers.toolTip.options);
            ko.utils.extend(options, local);

            $(element).tooltip(options);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(element).tooltip("destroy");
            });
        },
        options: {
            placement: "right",
            trigger: "hover"
        }
    };

    var mediaPanel = {
        init: function() {

        },

        update: function(element, valueAccessor, allBindings) {
            // First get the latest data that we're bound to
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);

            var page = allBindings.get('page');
            page = ko.unwrap(page);

            var identify = allBindings.get('identify');
            identify = ko.unwrap(identify);

            // Now manipulate the DOM element
            if(identify == "sm-video-panel") {
                if (page != "video-call" && window.callData && window.callData.calltype == "videocall") {
                    //if the small panel is hidden => set up and show the small panel
                    if (!valueUnwrapped && !document.querySelector('#smallScreenVideoCall1 .sm-video-container').children.length) {
                        // we only need to save the remote video, to not loos the video stream
                        var smVideo = document.querySelector(".remotevid");
                        document.querySelector('#smallScreenVideoCall1 .sm-video-container').appendChild(smVideo);
                        document.querySelector('.remotevid').play();
                    }
                }

                if(page == "video-call" && window.callData) {  //if you are in the call view page
                    setTimeout(function () {
                        if(document.querySelector('#smallScreenVideoCall1 .sm-video-container').children.length) {
                            document.querySelector('.remotevid_parent').innerHTML = "";
                            var smVideo = document.querySelector("#smallScreenVideoCall1 .remotevid");
                            document.querySelector(".remotevid_parent").appendChild(smVideo);
                            document.querySelector('.remotevid').play();
                        }
                    }, 1000);
                }
            }

            if(identify== "sm-audio-panel") {
                // if there is audio call and you are not in the audio call view
                if (page != "audio-call" && window.callData && window.callData.calltype == "audiocall") {
                    //if the small panel is hidden => set up and show the small panel
                    var isUpdated = document.querySelector('#smallScreenAudioCall1').classList[0] == "updated-smaudio";
                    if (!valueUnwrapped && !isUpdated) {
                        var AudioPanel = document.querySelectorAll('#smallScreenAudioCall1 .remote-audio-wrapper');
                        document.querySelector('#smallScreenAudioCall1').classList.add("updated-smaudio");

                        AudioPanel.forEach(function(pNode) {
                            pNode.innerHTML = "";
                            document.querySelectorAll('#contacts-audio .remote-audio-wrapper div').forEach(function(node) {
                                if(pNode.getAttribute('data-key') == node.getAttribute('data-key')) {
                                    pNode.appendChild(node);
                                    node.querySelector('.remote-audio').play();
                                }
                            })
                        })
                    }
                }

                if(page == "audio-call" && window.callData) {  //if you are in the call view page
                    //if there is an audio call => restore the audio elements from the small panel
                    document.querySelector('#smallScreenAudioCall1').classList.remove("updated-smaudio");

                    setTimeout(function () {
                        var AudioPanel = document.querySelectorAll('#contacts-audio .remote-audio-wrapper');
                        var isUpdated = false;
                        document.querySelector('#contacts-audio').classList.forEach(function(className) {
                            if(className == "updated-audio") {
                                isUpdated = true;
                            }
                        });
                        document.querySelector('#contacts-audio').classList.add("updated-audio");

                        if(AudioPanel && !isUpdated) {
                            AudioPanel.forEach(function(pNode) {
                                pNode.innerHTML = "";
                                document.querySelectorAll('.audio-container .remote-audio-wrapper div').forEach(function(node) {
                                    if(pNode.getAttribute('data-key') == node.getAttribute('data-key')) {
                                        pNode.appendChild(node);
                                        node.querySelector('.remote-audio').play();
                                    }
                                })
                            })
                        }
                    }, 1000);
                }
            }

        }
    };

    var bindobj = {
        init: function () {
            ko.bindingHandlers['switchbtn'] = switchbtn;
            ko.bindingHandlers['progressctrl'] = progressctrl;
            ko.bindingHandlers['utcdate'] = utcdate;
            ko.bindingHandlers['isodate'] = isodate;
            ko.bindingHandlers['localdate'] = localdate;
            ko.bindingHandlers['activitypanel'] = activitypanel;
            ko.bindingHandlers['fadeVisible'] = fadeVisible;
            ko.bindingHandlers['toolTip'] = toolTip;
            ko.bindingHandlers['mediaPanel'] = mediaPanel;
        }
    };

    module.exports = bindobj;
})();
