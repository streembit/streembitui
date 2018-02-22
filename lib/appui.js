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
                streembit.notify.error("First initialize the account by connecting to the Streembit P2P network");
                return "initui";
            }

            var curr_account = accounts.get_account(appsrvc.username);
            if (!curr_account) {
                streembit.notify.error("The account is not initialized. First initialize the account by connecting to the Streembit P2P network");
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
        
        switch(navroute.page) {
            case 'audio-call':
                $('#smallScreenAudioCall1').hide();
                if(window.callData) {
                    $('#smallScreenAudioCall1 div').appendTo('#call .forShowChatPos');
                    $('.forShowChatPos div').addClass('normalAudDiv');
                    $('#call .forShowChatPos').find('.normalAudDiv').after($('.remote-audio'));
                    $('.forShowChatPos div').removeClass('smallWindowPos');
                    $('.remote-audio')[0].play();
                    $call.children('div').show();

                    if($(".contacts-container").hasClass('activate')){
                        $('#call').css({'width': '86%'});
                    }else{
                        $('#call').css({'width': '100%'});
                    }
                } else {
                    viewModel.callData({
                        contactName: params.contact.name
                    });
                    $call.show();
                    $call.css({'width': '100%'});
                }
                window.callData = params;
                break;
            default:
                if(window.callData) {
                    $('#smallScreenAudioCall1').show();
                    var $audioCont = $('.forShowChatPos div');
                    $call.children('div').hide();
                    $('#smallScreenAudioCall1 > div').removeClass('normalAudDiv');
                    var smallWD = $audioCont.appendTo('#smallScreenAudioCall1');
                    smallWD.addClass('smallWindowPos');
                    $('#smallScreenAudioCall1').find('.smallWindowPos').after($('.remote-audio'));
                    $('.remote-audio')[0].play();
                 
                    if($(".contacts-container").hasClass('activate')){
                        $('#smallScreenAudioCall1').css({'right':'240px'});
                    }else{
                        $('#smallScreenAudioCall1').css({'right':'0px'});
                    }
                } else {
                    $call.children('div').show();
                    $call.hide();
                    $('#smallScreenAudioCall1').hide();
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
        callData: ko.observable({contactName: ''}),

        nav: function (page, params) {
            navigate.bind(this)(page, params);
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
                    streembit.notify.error("Restore account error: %j", err);
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
                return streembit.notify.error("First connect to the Streembit P2P network");
            }

            appevents.dispatch("display-view", "offline-contact-request");
        },

        accept_contact_request: function () {
            if (!appsrvc.account_connected) {
                return streembit.notify.error("First connect to the Streembit P2P network");
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
                streembit.notify.error("Error in displaying the view: %j", err);
            }
        },
        hangup: function() {
            peercomm.hangup_call(window.callData.contact);
            appevents.dispatch("on-cmd-hangup-call");

            $('#smallScreenAudioCall1 div').appendTo('#call .forShowChatPos');
            $('.forShowChatPos div').addClass('normalAudDiv');
            $('#call .forShowChatPos').find('.normalAudDiv').after($('.remote-audio'));
            $('.forShowChatPos div').removeClass('smallWindowPos');
            
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



