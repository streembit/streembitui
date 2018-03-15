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

import i18next from 'i18next';
import i18nextko from "./bindinghandlers/i18next-ko";
import appevents from "appevents";
import apputils from "apputils";
import appsrvc from "appsrvc";
import user from "user";
import accounts from "accounts";
import peercomm from "peercomm";
import bindings from "./bindinghandlers/bindings";
import WebrtcData from "webrtcdata";
import aboutview from './app/views/about/about.html!text';
import database from "database";
import uihandler from "uihandler";
import errcodes from "errcodes";
import errhandler from "errhandler";
import webrtccall from "webrtccall";
import filesender from "filesender";
import uuid from "uuid";
import connections from "connections";
import contactlist from "contactlist";
import groupcall from "groupcall";


function MainVM() {
    let $call = $("#call"),
        $main = $("#main");

    function validate_page(param) {
        var page = param;
        if (page == "initaccount") {
            var accountlist = accounts.list;
            if (!accountlist || !accountlist.length) {
                // there is no account exists -> navigate to new account
                page = "createaccount";
            }
        }
        else if (page == "changepassword") {
            if (!appsrvc.username) {
                // streembit.notify.error("First initialize the account by connecting to the Streembit P2P network");
                streembit.notify.error(errhandler.getmsg(errcodes.UI_FIRST_INITIALIZE_P2P_NETWORK));
                return "initui";
            }

            var curr_account = accounts.get_account(appsrvc.username);
            if (!curr_account) {
                // streembit.notify.error("The account is not initialized. First initialize the account by connecting to the Streembit P2P network");
                streembit.notify.error(errhandler.getmsg(errcodes.UI_THE_ACCOUNT_ISNOT_INITIALIZED));
                page = "initui";
            }
        }

        return page;
    }
    function navigate(page, params) {
        var navroute = {
            "page": "",
            "params": params
        };

        if (page) {
            navroute.page = validate_page(page);
        }
        else {
            if (appsrvc.account_connected) {
                navroute.page = streembit.view.mainapp || "dashboard";
            }
            else {
                navroute.page = "initui";
            }
        }
        const smallMediaContainer = $('#smallScreenAudioCall1');
        switch(navroute.page) {
            case 'audio-call':
                smallMediaContainer.hide();
                if(window.callData) {
                    const smAudio = $('#smallScreenAudioCall1 > div');
                    $.each(smAudio, (eix, el) => {
                        const divel = $('#call .forShowChatPos > div').eq(eix);
                        divel.find('h3').text($(el).find('span').eq(0).text());
                        divel.find('div').html('').append($(el).find('.audio-viz'));
                        divel.append($(el).find('.remote-audio'));
                    });

                    const audio = $('#call .forShowChatPos').find('audio');
                    $.each(audio, (eix, el) => {
                        $('#call .forShowChatPos').find('audio')[eix].play();
                    });

                    $('#smallScreenAudioCall1 > div').remove();


                    $call.show();
                    $call.children('div').show();

                    if($(".contacts-container").hasClass('activate')){
                        $('#call').css({'width': '86%'});
                    }else{
                        $('#call').css({'width': '100%'});
                    }
                } else {
                    viewModel.callData(params.contact);
                    $call.show();
                    $call.css({'width': '100%'});
                    $('#call .forShowChatPos').css({'display': 'block'});
                    $('#call .audio-viz').css({'display': 'inline-block'});
                    if (!$('#call .forShowChatPos').children().length) {
                        const cantainer = $('<div id="'+params.contact.pkeyhash+'" style="clear:both; text-align:center"></div>');
                        cantainer.append('<span>'+params.contact.name+'</span>');
                        cantainer.append('<img src="/lib/images/clear.png" width="14" height="14" alt="" class="rm_partee" style="cursor: pointer" />');
                        cantainer.append('<div style="text-align: center;">\
                                            <canvas class="audio-viz" style="background-color: #666;height:220px;display:inline-block"></canvas>\
                                          </div>');
                        cantainer.append('<audio class="remote-audio" controls autoplay></audio>');
                        $('#call .forShowChatPos').append(cantainer);

                    }
                    if(!$('#call .calltime_parent').children().length) {
                        const callTime = $('<div data-calltime="'+params.contact.pkeyhash+'"></div>');
                        callTime.append('Call with <span>'+params.contact.name+'</span>');
                        callTime.append('&nbsp;<span></span>');
                        $('#call .calltime_parent').append(callTime);

                    }
                }
                window.callData = params;
                break;
            default:
                if(window.callData) {
                    if (smallMediaContainer.css('display') !== 'block') {
                        $.each($('.forShowChatPos > div'), (eix, el) => {
                            const excerpt = $('<div></div>').attr({ 'data-cid': $(el).attr('id') });
                            excerpt.toggleClass('smallSpeakerWind');
                            excerpt.append($('<span></span>').text($(el).find('span').text()));
                            excerpt.append($('<div></div>').append($(el).find('.remote-audio')).css({ position: 'absolute', opacity: 0, height: 1, bottom: 30 }));
                            excerpt.append($('<div></div>').css({ float: 'none',  }).append($(el).find('.audio-viz')).css({'display':'none'}));
                            excerpt.append($('<div></div>').html('').css({ float: 'none', clear: 'both', width: '100%', height: 0, background: '#c4c4c4' }));

                            smallMediaContainer.append(excerpt);
                        });
                        $('.smallSpeakerWind').after('<div class="smSpeakSt" style="text-align:center;"><i class="fa fa-volume-up" style="font-size:45px;color:#6893c7"></i></div>');

                        $call.children('div').hide();
                        const audio = smallMediaContainer.find('audio');
                        $.each(audio, (eix, el) => {
                            smallMediaContainer.find('audio')[eix].play();
                        });
                        smallMediaContainer.find('canvas').css({ width: '200px', height: 64 });
                        smallMediaContainer.show();

                        if($(".contacts-container").hasClass('activate')){
                            smallMediaContainer.css({'right':'240px'});
                        }else{
                            smallMediaContainer.css({'right':'0px'});
                        }

                    }
                } else {
                    $call.children('div').show();
                    $call.hide();
                    smallMediaContainer.hide();
                }
                break;
        }

        viewModel.route(navroute);

        appsrvc.currentview = page;

        uihandler.set_view_title(page);
    }

    var viewModel = {
        route: ko.observable({ page: 'emptyview' }),
        user_name: ko.observable(''),
        callData: ko.observable({ name: '', pkeyhash: '' }),
        make_connection_inprogress: false,
        showInvite: ko.observable(false),
        contacts: ko.observableArray([]),

        nav: function (page, params) {
            navigate.bind(this)(page, params);
            $('.calltime_parent').css({'display': 'none'});
        },

        cmd: function (action) {
            if (action) {
                switch (action) {
                    case 'delete-account':
                        break;
                    default:
                        appevents.cmd(action);
                        break;
                }
            }
        },

        onNavigate: function (page, params) {
            navigate.bind(this)(page, params);
        },

        backupContacts: function () {
            apputils.backup_contacts();
        },

        restoreContacts: function () {
            apputils.restore_contacts(function () {
                console.log("contacts restored")
            });
        },

        backupAccount: function () {
            apputils.backup_account();            
        },

        restoreAccount: function () {
            console.log("cmd: restoreAccount");
            apputils.restore_account(function (err) {
                if (err) {
                    // streembit.notify.error("Restore account error: %j", err);
                    streembit.notify.error(errhandler.getmsg(errcodes.UI_ACCOUNTRESTORE, err));
                }
            });
        },

        my_contacts: function () {            
            // $('[data-action="contactsBar"]').trigger('click');
            appevents.dispatch("display-view", "my-contacts");

        },

        hideContacts: function (contact) {
            $('.contacts-container').hide();
            if (contact) {
                viewModel.nav("contact", contact);
            }
        },

        about: function () {
            var box = bootbox.dialog({
                title: "About Streembit",
                message: aboutview,
                buttons: {
                    close: {
                        label: "Close",
                        className: "btn-light",
                        callback: function () {
                        }
                    }
                }
            });

            box.init(function () {
                $(".modal-header").css("padding", "4px 8px 4px 12px");
                $("#lbl_app_version").text(streembit.globals.version);
                $(".modal-dialog").addClass('forHelpAboutModal');
                $('button').css({'border': '1px solid #ccc'});
            });
        },

        clearDatabase: function () {
            apputils.clear_database();
        },

        checkUpdates: function () {   
            apputils.getversion(function (err, version) {
                streembit.notify.success("Your Streembit version v" + streembit.globals.version + " is up to date, there is no new version available.");

                //if (err || !version) {
                //    return streembit.notify.error("Error in retrieving version from the repository");
                //}

                //try {
                //    var tverarr = streembit.globals.version.split(".");
                //    var strver = tverarr.join('');
                //    var numver = parseInt(strver);
                //    var trcvver = version.split('.');
                //    var rcvnum = trcvver.join('');
                //    var rcvver = parseInt(rcvnum);
                //    if (numver >= rcvver) {
                //        streembit.notify.success("Your Streembit version v" + streembit.globals.version + " is up to date, there is no new version available.");
                //    }
                //    else {
                //        streembit.notify.success("There is a new Streembit version v" + version + " available for download. Your Streembit current version is v" + streembit.globals.version);
                //    }
                //}
                //catch (e) {
                //    streembit.notify.error_popup("Error in populating version: %j", e);
                //}                
            });         
        },

        offline_contact_request: function () {            
            if (!appsrvc.account_connected) {
                // return streembit.notify.error("First connect to the Streembit P2P network");
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_FIRST_CONNECT_TOSTR_P2P));
            }

            appevents.dispatch("display-view", "offline-contact-request");
        },

        accept_contact_request: function () {
            if (!appsrvc.account_connected) {
                // return streembit.notify.error("First connect to the Streembit P2P network");
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_FIRST_CONNECT_TOSTR_P2P));
            }

            appevents.dispatch("display-view", "accept-contact-request");
        },

        displayview: function (view, params) {
            try {
                viewModel.viewname(view);
                viewModel.viewparams(params);
                appsrvc.currentview = view;
            }
            catch (err) {
                // streembit.notify.error("Error in displaying the view: %j", err);
                streembit.notify.error(errhandler.getmsg(errcodes.UI_ERR_DISPLAYING_THE_VIEW, err));
            }
        },
        hangup: function() {
            peercomm.hangup_call(window.callData.contact);
            webrtccall.hangup();
            appevents.navigate('dashboard');
            window.callData = null;

            $('.calltime_parent').css({'display': 'none'});
            var audiorem = $('#smallScreenAudioCall1 .remote-audio');
            var canvasviz = $('#smallScreenAudioCall1 .audio-viz');
            $('#call .forShowChatPos img').next().append(canvasviz);
            $('#call .forShowChatPos img').next().after(audiorem);
            $('#smallScreenAudioCall1').hide();
            $('#smallScreenAudioCall1 > div').remove();
            $('#smallScreenAudioCall1 span div').remove();
            $('#smallScreenAudioCall1 span audio').remove();
        },

        remove_audio: function (a) {
            webrtccall.toggle_audio(false, function () {
                $('.spallWindMuteIc').toggleClass('muted');
                if($('.spallWindMuteIc').hasClass('muted')){
                    $('.spallWindMuteIc').removeClass('fa fa-microphone');
                    $('.spallWindMuteIc').addClass('fa fa-microphone-slash');
                    $('.spallWindMuteIc').css({'color': '#a90329'});
                    $('.smSpeakSt > i').removeClass('fa fa-volume-up');
                    $('.smSpeakSt > i').removeClass('fa fa-volume-off');
                }else{
                    $('.spallWindMuteIc').removeClass('fa fa-microphone-slash');
                    $('.spallWindMuteIc').addClass('fa fa-microphone');
                    $('.spallWindMuteIc').css({'color': '#366297'});
                    $('.smSpeakSt > i').addClass('fa fa-volume-up');
                }            
            });
        },
        sendfile: function () {
            if (!peercomm.is_peer_session(viewModel.callData().name)) {
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_SESSION));
            }

            try {
                var filetask = new filesender();
                filetask.run(window.callData.contact);
            }
            catch (err) {
                streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err));
            }
        },
        showchat: function () {
            var contName = $('.all-contacts-field > div').find($('.text-main'));
            for(var i = 0; i< contName.length; i++){
                if(contName[i].innerText === window.callData.contact.name){
                    contName.eq(i).trigger('click');
                    setTimeout( function () {
                        $('.smallScrChatBtn').trigger('click');
                    }, 500);
                }
            }
        },

        Contact: function() {
            this.isonline = ko.observable();
            this.isoffline = ko.observable();
            this.lastping = ko.observable(0);
            this.error = ko.observable("");
            this.warnicon = ko.observable("");
            this.warning = ko.observable("");
        },

        show_invite: function () {
            this.showInvite(!this.showInvite());
            if(!$('.smallScreenContactsList').children().length){
                $.each(contactlist.contacts, (idx, c) => {
                    if (c.user_type !== 'human' || c.name === window.callData.contact.name) {
                        return true;
                    }
                    viewModel.contacts.push(Object.assign(new viewModel.Contact(), c));
                });
            }
        },

        invite: function (item) {
            this.showInvite(false);
            groupcall.invite(item);
        }

    };


    appevents.addListener("on-username-change", function (username) {
        viewModel.user_name(username);
    });

    // app ui event
    appevents.addListener("on-appui-event", (action, param1, param2) => {
        switch (action) {
            case "hide-contacts-bar":
                viewModel.hideContacts(param1);
                $('.contacts-container').removeClass('activate');
                $('#smallScreenAudioCall1').css({'right': 0});
                break;
            case "display-view":
                viewModel.nav(param1, param2);
                break;
            default:
                break;
        }
    });

    return viewModel;
}

export default function() {
    return new Promise((resolve, reject) => {
        // initialize the locals/languages binding handlers
        var language = i18next.language;
        i18nextko.init(ko, $, (language || "en"));

        // initialize the knockout binding handlers
        bindings.init();

        // initialize the main viewmodel
        var vm = new MainVM();
        appevents.onNavigate(vm.onNavigate);        

        // KO data binding
        ko.applyBindings(vm);

        resolve();
    });       
}



