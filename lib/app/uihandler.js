
(function () {
    var ko, $;
    var appevents = require("appevents");
    var util = require("util");
    var logger = require("./logger");
    var i18next = require("i18next"); 
    var errcodes = require("errcodes");
    var errhandler = require("errhandler");
    var listOfDangerError = [];
    var listOfNotifyMsgs = [];

    var uihandler = {

        loaddiv: ("#" + streembit.ui.load_container),
        
        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            var self = this;            

            //  register these utility functions for backward compatibility reasons
            //  so the existing code can be reused to show notifications

            streembit.notify.error = function (err, param, activitymsg) {
                if (!err) { return; }

                var text = self.get_err_msg(err, param);
                
                if (!self.isMessageToShow(text, listOfDangerError)) {
                    return;
                }
                
                activitymsg
                    ? self.display_activity(text, "error")
                    : self.display_notify('danger', null, text, 11000);

                logger.error(text);

                return text;
            };

            streembit.notify.success = function (msg, param, activitymsg) {
                var text = self.get_msg(msg, param);
                
                if (!activitymsg) {
                    self.display_notify('success', null, text, 7000);
                }
                else {
                    // display in the footer taskbar
                    self.display_activity(text, "notify");
                }

                logger.info(text);
            };

            streembit.notify.info = function (msg, param, activitymsg) {
                var text = self.get_msg(msg, param);
    
                if (!self.isMessageToShow(text, listOfNotifyMsgs)) {
                    return;
                }
                
                if (!activitymsg) {
                    self.display_notify('info', null, text, 11000);
                }
                else {
                    // display in the footer taskbar
                    self.display_activity(text, "notify");
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

            streembit.activity.msg = function (msg) {
                self.display_activity(msg, "msg");
            };

            streembit.activity.error = function (err) {
                self.display_activity(err, "error");
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
        
        isMessageToShow(text, list) {
            const time = Date.now();
            const isNotDuplicated = list.every(
                err => err.text !== text ? true : (time - err.time) > 600000
            );
    
            return isNotDuplicated
                ? !!list.unshift({ text, time })
                : false;
        },

        get_err_msg: function (err, param) {
            if (!err) {
                return;
            }
        
            var msg = err;
            if (!param && typeof param != 'string') {
                if (err.message) {
                    msg = err.message;
                }
                return msg;
            }

            if (typeof err != 'string') {
                if (err.message) {
                    msg = err.message;
                }
                return msg;
            }

            if (err.indexOf("onPeerError") > -1 && param.code && param.code == "ETIMEDOUT") {
                msg = "Peer is not available. Error: " + (param.message || "message timed out");
                return msg;
            }

            if (err.indexOf("%j") == -1) {
                msg = util.format(err, param);
                return msg;
            } 
            
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
            $('#main').block({
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
            $('#main').unblock();
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

        display_activity: function (msg, type) {
            appevents.dispatch("on-activity", { msg: msg, type: type, time: Date.now()}); 
        },

        getconfirm: function (msg) {
            var text = i18next.t(msg);
            if (!text) {
                // it will be ugly but must show a message
                text = msg;
            }

            var answer = confirm(text);
            return answer;
        },

        qrGenerate: function (element, qrc) {
            var options = {
                // render method: 'canvas', 'image' or 'div'
                render: 'canvas',
                // error correction level: 'L', 'M', 'Q' or 'H'
                ecLevel: 'H',
                // offset in pixel if drawn onto existing canvas
                left: 0,
                top: 0,
                // size in pixel
                size: 200,
                // background color or image element, null for transparent background
                background: '#fff',
                // content
                text: qrc
            };

            $(element).qrcode(options);
        },

        copyToClipboard: function (text) {
            // deselect everything that was possibly selected
            if ( document.selection ) { // just for a case, IE
                document.selection.empty();
            } else if ( window.getSelection ) {
                window.getSelection().removeAllRanges();
            }

            var copyBlock = $('#copyContainer');
            if (!copyBlock.length) {
                copyBlock = $('<div>').attr('id', 'copyContainer');
            } else {
                copyBlock.html('');
            }

            // create hidden HTML container somewhere with position fixed/absolute
            copyBlock.css({ position: 'fixed', left: 0, top: 0, width: 0, height: 0, 'z-index': 100, opacity: 0 }).appendTo('body');

            // insert textarea into it
            $('<textarea>').css({ width: 1, height: 1, padding: 0 }).appendTo(copyBlock);

            // give the textarea value of the funk argument
            // then select the text ( .text() should also work )
            copyBlock.find('textarea').val(text).select();

            // and finally copy it to clipboard
            try {
                document.execCommand('copy');
                streembit.notify.success('Successfully copied to clipboard');
            } catch (e) {
                // streembit.notify.error('Programmable coping not supported by your environment');
                streembit.notify.error(errhandler.getmsg(errcodes.UI_COPYING_NOT_SUPPORTED));
            }

            // then clean DOM up after yourself
            $('#copyContainer').remove();
        },

        saveImgFromCanvas: function (parent, name) {
            // find canvas inside the parent
            var canvas = parent.find('canvas');
            // attach invisible <a> to the parent
            $('<a>')
                .attr({ href: canvas[0].toDataURL('image/png'), download: `qrcode_${name}.png` })
                .css({ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 })
                .html('Save QR Code')
                .appendTo(parent);
            // trigger download
            var a = parent.find('a');
            a[0].click();
            // clean DOM up after yourself
            parent.find('a').remove();
        }
    };

    module.exports = uihandler;
})();
