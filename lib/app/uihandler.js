
(function () {
    var ko, $;
    var appevents = require("appevents");
    var util = require("util");
    var logger = require("./logger");
    var i18next = require("i18next"); 

    var uihandler = {

        loaddiv: ("#" + streembit.ui.load_container),
        taskbar: ("#" + streembit.ui.taskbarmsg),

        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            var self = this;            

            //  register these utility functions for backward compatiblity reasons
            //  so the existing code can be reused to show notifications

            streembit.notify.error = function (err, param, istaskbar) {
                if (!err) { return; }

                var text = self.get_err_msg(err, param);
                if (!istaskbar) {
                    self.display_notify('danger', null, text, 11000);
                }
                else {
                    // display in the footer taskbar
                    self.display_taksbar_msg(text, true);
                }

                logger.error(text);

                return text;
            };

            streembit.notify.success = function (msg, param, istaskbar) {
                var text = self.get_msg(msg, param);
                if (!istaskbar) {
                    self.display_notify('success', null, text, 7000);
                }
                else {
                    // display in the footer taskbar
                    self.display_taksbar_msg(text, false);
                }

                logger.info(text);
            };

            streembit.notify.info = function (msg, param, istaskbar) {
                var text = self.get_msg(msg, param);
                if (!istaskbar) {
                    self.display_notify('info', null, text, 11000);
                }
                else {
                    // display in the footer taskbar
                    self.display_taksbar_msg(text, false);
                }

                logger.info(text);
            };

            streembit.notify.hideprogress = function () { }

            streembit.ui.set_account_title = function (account) {
                appevents.dispatch("on-username-change", account);
            };           

            streembit.ui.reset_title = function (account) {
                document.title = (streembit.globals.appname || "Streembit");
            };    
        },

        display_notify: function (type, title, text, time) {
            $.notify(
                {
                    title: title ? ("<strong>" + title + "</strong> ") : '',
                    message: text,
                },
                {
                    type: type,
                    delay: time,
                    offset: { y: 55, x: 6},
                    placement: { align: 'right' }
                }
            );
        },

        get_err_msg: function(err, param) {
        
            var msg = err;
            if (param) {
                if (typeof err == 'string') {

                    if (err.indexOf("onPeerError") > -1 && param.code && param.code == "ETIMEDOUT") {
                        msg = "Peer is not available. Error: " + (param.message || "message timed out");
                    }
                    else {
                        if (err.indexOf("%j") > -1) {
                            //  the Error object is not formated well from the util library
                            //  send only the message field if that is an Eror object
                            if (param.message && (typeof param == "Error" || typeof param == "error" || typeof param == "object" || typeof param == "Object")) {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param.message);
                            }
                            else if (param.error && (typeof param == "string")) {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param.error);
                            }
                            else if (typeof param == 'string') {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param);
                            }
                            else {
                                if (typeof param == "object" || typeof param == "Object") {
                                    err = err.replace("%j", "");
                                    err = err.replace("%s", "");
                                    msg = err;
                                }
                                else if (param.toString) {
                                    var str = param.toString();
                                    if (str) {
                                        err = err.replace("%j", "%s");
                                        msg = util.format(err, str);
                                    }
                                }
                            }
                        }
                        else {
                            msg = util.format(err, param);
                        }
                    }
                }
                else {
                    if (err.message) {
                        msg = err.message;
                    }
                }
            }

            return msg;
        },
    
        get_msg: function(msg, param) {
            var result = msg;
            if (param) {
                if (typeof msg == 'string' && msg.indexOf("%s") > -1) {
                    result = util.format(msg, param);
                }
            }

            return result;
        },

        success: function(msg, param, title, time) {
            var text = get_msg(msg, param);
            m_notify = $.notify(
                {
                    title: title ? ("<strong>" + title + "</strong> ") : '',
                    message: text
                },
                {
                    type: 'success',
                    delay: time ? time : 7000
                }
            );
        },

        set_load_info: function (value, nolog) {
            var text = i18next.t(value);
            if(!text) {
                text = value;
            }
            $("#" + streembit.ui.load_info).text(text);
            try {
                if (!nolog) {
                    logger.info(text);
                }
            }
            catch (err) { }
        },

        set_view_title: function (value) {
            var text = i18next.t("view-title-" + value);
            if (!text) {
                text = value;
            }
            $("#ribbon").find(".breadcrumb").text(text);
        },

        on_load_complete: function () {
            $('body').attr('data-appinit', false);
        },

        on_account_load_complete: function () {
            $('body').attr('data-account-load-complete', true);
            $('#header').show();
            $('#left-panel').show();
            $('#ribbon').show();
            $('.page-footer').show();
        },

        on_appload_error: function (error) {
            var msg = "Loading Streembit application failed. ";
            if (typeof error === "string") {
                msg += error;
            }
            else if (error && error.message) {
                msg += error.message;
            }
            else {
                msg = "Unknown error. Please check the log files in the log directory for more information."
            }

            // this indicates the app is loaded
            $('body').attr('data-appinit', false);

            appevents.navigate("errorview", { error: msg});
        },

        blockwin: function () {
            $.blockUI({
                message: '<div><div style="font-weight:bold;display:inline-block;border-radius:3px; color:#fff;opacity: .8;padding:10px 20px;background:#000"><div style="display:flex;align-items:center;justify-content:center;"><i class="fa fa-circle-o-notch fa-spin fa-2x fa-fw"></i>&nbsp;&nbsp;<span style="font-size: 14px;">Loading ...</span></div></div></div>',
                css: {
                }
            }); 
        },

        unblockwin: function () {
            $.unblockUI();
        },

        blockview: function (param) {
            var msg = param ? param : '<h4>Processing request</h4>'; 
            $('#view-container').block({
                message: msg,
                css: {
                    border: 'none',
                    opacity: 1,
                    color: '#fff',
                    width: '100%',
                    height: '100%',
                    left: 0,
                    top: 0
                }
            });
        },

        unblockwiew: function () {
            $('#view-container').unblock(); 
        },

        blockelement: function (element, message) {
            var msg = message ? message : '<h5>Processing request</h5>'; 
            $(element).block({
                message: msg,
                css: {
                    border: 'none',
                    opacity: 1,
                    color: '#fff',
                    width: '100%',
                    height: '100%',
                    left: 0,
                    top: 0
                }
            });
        },

        unblockelement: function (element) {
            $(element).unblock();
        },

        display_taksbar_msg: function (msg, iserror) {
            var iitem = $(uihandler.taskbar).find("i");
            if (iserror) {
                $(uihandler.taskbar).addClass("taskbar-errormsg");
                $(uihandler.taskbar).removeClass("taskbar-infomsg");
                $(iitem).removeClass("fa-info-circle");
                $(iitem).addClass("fa-exclamation-circle");
            }
            else {
                $(uihandler.taskbar).removeClass("taskbar-errormsg");
                $(uihandler.taskbar).addClass("taskbar-infomsg");
                $(iitem).removeClass("fa-exclamation-circle");
                $(iitem).addClass("fa-info-circle");
            }

            var spanclass = $(uihandler.taskbar).find(".tasktext");
            $(spanclass).text(msg);

            uihandler.msgmaintain(msg);
        },

        msgmaintain: function (msg) {
            setTimeout(function () {
                var spanclass = $(uihandler.taskbar).find(".tasktext");
                var text = $(spanclass).text();
                if (text == msg) {
                    $(uihandler.taskbar).text("");
                }
            },
            20000);
        },

        getconfirm: function (msg) {
            var text = i18next.t(msg);
            if (!text) {
                // it will be ugly but must show a message
                text = msg;
            }

            var answer = confirm(text);
            return answer;
        }
    };

    module.exports = uihandler;
})();
