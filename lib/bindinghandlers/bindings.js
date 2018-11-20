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

    var videoPanel = {
        update: function(element, valueAccessor, allBindings) {
            // First get the latest data that we're bound to
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);

            var page = allBindings.get('page');
            page = ko.unwrap(page);
            var containers = allBindings.get('containers');

            // Now manipulate the DOM element
            if (page != "video-call" && window.callData && window.callData.calltype == "videocall") {
                //if the small panel is hidden => set up and show the small panel
                if (!valueUnwrapped) {
                    value(true);
                    var smContainer = element.querySelector(containers.smContainer);
                    var video = document.querySelector(containers.videoViewContainer + " video");

                    // we only need to save the remote video, to not loos the video stream
                    smContainer.innerHTML = "";
                    smContainer.appendChild(video);
                    smContainer.querySelector('video').play();
                }
            }

            if(page == "video-call" && window.callData) {  //if you are in the call view page
                setTimeout(function () {
                    if(valueUnwrapped) {
                        var video = element.querySelector("video");
                        var callViewVideo = document.querySelector(containers.videoViewContainer);

                        callViewVideo.innerHTML = "";
                        callViewVideo.appendChild(video);
                        callViewVideo.querySelector('video').play();
                    }
                }, 1000);
            }
        }
    };

    var audioPanel = {
        update: function(element, valueAccessor, allBindings) {
            // First get the latest data that we're bound to
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);

            var page = allBindings.get('page');
            page = ko.unwrap(page);
            var containers = allBindings.get('containers');

            // Now manipulate the DOM element
            // if there is audio call and you are not in the audio call view
            if (page != "audio-call" && window.callData && window.callData.calltype == "audiocall") {
                //if the small panel is hidden => set up and show the small panel
                if (!valueUnwrapped) {
                    value(true);
                    var audioPanels = element.querySelectorAll(containers.smContainer);
                    var callViewAudios = document.querySelectorAll(containers.audioViewContainer);

                    audioPanels.forEach(function(pNode) {
                        pNode.innerHTML = "";
                        callViewAudios.forEach(function(node) {
                            if(pNode.getAttribute('data-key') == node.getAttribute('data-key')) {
                                pNode.appendChild(node);
                                node.querySelector('audio').play();
                            }
                        })
                    })
                }
            }

            if(page == "audio-call" && window.callData) {  //if you are in the call view page
                //if there is an audio call => restore the audio elements from the small panel
                setTimeout(function () {
                    var callViewAudios = document.querySelectorAll(containers.audioViewContainer);
                    var audioPanels = element.querySelectorAll(containers.smContainer);

                    if(callViewAudios && valueUnwrapped) {
                        callViewAudios.forEach(function(pNode) {
                            var audioContainer = pNode.parentNode;
                            audioContainer.innerHTML = "";
                            audioPanels.forEach(function(node) {
                                var audio = node.childNodes[0];
                                if(audio && audioContainer.getAttribute('data-key') == audio.getAttribute('data-key')) {
                                    audioContainer.appendChild(audio);
                                    audio.querySelector('audio').play();
                                }
                            })
                        })
                    }
                }, 1000);
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
            ko.bindingHandlers['audioPanel'] = audioPanel;
            ko.bindingHandlers['videoPanel'] = videoPanel;
        }
    };

    module.exports = bindobj;
})();
