
(function () {
    var ko, $;
    var appevents = require("appevents");
    var util = require("util");
    var logger = require("./logger");

    var uihandler = {

        loaddiv: ("#" + streembit.ui.load_container),
        maindiv: ("#" + streembit.ui.main),
        taskbar: ("#" + streembit.ui.taskbarmsg),

        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            var self = this;            

            streembit.notify.error = function (err, param, istaskbar) {
                if (!err) { return; }

                var text = self.get_err_msg(err, param);
                if (!istaskbar) {
                    self.display_notify('danger', null, text, 11000);
                }
                else {
                    // display in the footer taskbar
                    self.display_taksbar_msg(text, true);
                    // log in file
                    logger.error(text);
                }
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
            };

            streembit.UI.set_account_title = function (account) {
                document.title = "Streembit - " + account;
            };           

            function onNotifyMessage(type, msg, istaskbar) {

            }

            // listen for messages
            appevents.addListener("on-notify-message", onNotifyMessage);

        },

        display_notify: function (type, title, text, time) {
            $.notify(
                {
                    title: title ? ("<strong>" + title + "</strong> ") : '',
                    message: text
                },
                {
                    type: type,
                    delay: time 
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
                            else if (typeof param == 'string') {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param);
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

        set_load_info: function(value, nolog) {
            $("#" + streembit.ui.load_info).text(value);
            try {
                if (!nolog) {
                    logger.info(value);
                }
            }
            catch (err) { }
        },

        on_load_complete: function () {
            $(uihandler.loaddiv).hide();
            $(uihandler.maindiv).show();
        },

        on_appload_error: function (error) {
            var msg = "Loading application failed. Error: ";
            if (typeof error === "string") {
                msg += error;
            }
            else if (error && error.message) {
                msg += error.message;
            }
            else {
                msg = "Unknown error. Please check the log files in the log directory for more information."
            }
           
            $(uihandler.loaddiv).hide();
            $(uihandler.maindiv).show();

            streembit.notify.error(msg);
        },

        blockwin: function () {
            $.blockUI({
                message: '<h4>Processing request</h4>',
                css: {
                    border: 'none',
                    padding: '10px',
                    backgroundColor: '#000',
                    '-webkit-border-radius': '10px',
                    '-moz-border-radius': '10px',
                    opacity: .8,
                    color: '#fff'
                }
            }); 
        },

        unblockwin: function () {
            $.unblockUI();
        },

        display_taksbar_msg: function (msg, iserror) {
            $(uihandler.taskbar).text(msg);
            if (iserror) {
                $(uihandler.taskbar).addClass("taskbar-errormsg");
            }
            else {
                $(uihandler.taskbar).removeClass("taskbar-errormsg");
            }
            uihandler.msgmaintain(msg);
        },

        msgmaintain: function (msg) {
            setTimeout(function () {
                var text = $(uihandler.taskbar).text();
                if (text == msg) {
                    $(uihandler.taskbar).text("");
                }
            },
            12000);
        }
    };

    module.exports = uihandler;
})();
