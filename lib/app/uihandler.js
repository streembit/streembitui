
(function () {
    var ko, $;
    var appevents = require("./libs/events/AppEvents");
    var util = require("util");

    var uihandler = {

        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            var self = this;            

            streembit.notify.error = function (err, param, title, time) {
                if (!err) { return; }
                var text = self.get_err_msg(err, param);
                self.display_notify('danger', title, text, (time ? time : 11000));
            };

            streembit.notify.success = function (msg, param, title, time) {
                var text = self.get_msg(msg, param);
                self.display_notify('success', title, text, (time ? time : 8000));
            };

            streembit.notify.info = function (msg, param, title, time) {
                var text = self.get_msg(msg, param);
                self.display_notify('info', title, text, (time ? time : 8000));
            };

            streembit.UI.set_account_title = function (account) {
                document.title = "Streembit - " + account;
            };

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

        set_load_info: function(value) {
            $("#" + streembit.ui.load_info).text(value);
        },

        on_load_complete: function () {
            $("#" + streembit.ui.load_container).hide();
            $("#" + streembit.ui.navbar_section).show();
            $("#" + streembit.ui.main).show();
        }
    };

    module.exports = uihandler;
})();
