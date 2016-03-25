/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

var streemio = streemio || {};

var gui = global.appgui;

if (gui && gui.App && gui.App.dataPath) {
    logger.info("Data path is " + gui.App.dataPath);
}

var util = require('util');
var async = require("async");
// use the global.cryptolib so the browserify version can configure the browser crypto library
var nodecrypto = require(global.cryptolib);
var EccKey = require('./libs/crypto/EccKey');
var secrand = require('secure-random');

if (gui) {
    //  the desktop version supports these libraries
    var path = require('path');
    var fs = require('fs');
}

navigator.webkitTemporaryStorage.queryUsageAndQuota( 
    function (usedBytes, grantedBytes) {
        logger.debug('Database store uses ', usedBytes, ' of available ', grantedBytes, 'bytes');
    }, 
    function (e) { logger.error('webkitTemporaryStorage.queryUsageAndQuota error %j', e); }
);


streemio.util = (function (util) {
    
    function createDataDir(callback) {
        if (!gui) {
            callback();
        }
        else {
            var datapath = null;
            var datadir = 'data';
            
            if (streemio.config.isdevmode == true) {
                var wdir = process.cwd();
                datapath = path.join(wdir, datadir);
            }
            else {
                var nwPath = process.execPath;
                var nwDir = path.dirname(nwPath);
                datapath = path.join(nwDir, datadir);
            }
            
            fs.open(datapath, 'r', function (err, fd) {
                if (err && err.code == 'ENOENT') {
                    /* the directory doesn't exist */
                    fs.mkdir(datapath, function (err) {
                        if (err) {
                            // failed to create the log directory, most likely due to insufficient permission
                            callback(err);
                        }
                        else {
                            global.datapath = datapath;
                            callback();
                        }
                    });
                }
                else {
                    global.datapath = datapath;
                    callback();
                }
            });
        }
    }
    
    function loadView(view, callback) {
        var html = $("#streemio-view-" + view).html();
        callback(html);
    }
    
    function loadLogs(callback) {
        if (!gui) {
            //return callback("The browser version of Streemio does not support this feature. Try the desktop version for maximum security and to access more features!");
            callback(null, streemio.logger.logs);
        }
        else {
            if (!global.logspath) {
                return callback("The global logs path does not exists");
            }
            var logfile = 'streemio.log';
            var filepath = path.join(global.logspath, logfile)
            fs.readFile(filepath, 'utf8', function (err, data) {
                if (err) {
                    return callback(err);
                }
                callback(null, data);
            });
        }
    }
    
    function timeNow() {
        var d = new Date(),
            h = (d.getHours() < 10?'0':'') + d.getHours(),
            m = (d.getMinutes() < 10?'0':'') + d.getMinutes();
        var value = h + ':' + m;
        return value;
    }
    
    function getFileHash(path, callback) {
        if (streemio.Main.is_gui) {
            // the full nodejs library is available and the file hash can be computed
            var hash = nodecrypto.createHash('sha1');
            var stream = fs.createReadStream(path);
            
            stream.on('data', function (data) {
                hash.update(data, 'utf8')
            })
            
            stream.on('end', function () {
                var hexstr = hash.digest('hex');
                callback(hexstr);
            })
        }
        else {
            //  the browser can't compute the file hash and the browser version version does not support file hash computation
            callback(path);
        }
    }
    
    function deleteFile(path, callback) {
        fs.unlink(path, function (err) {
            callback(err);
        });
    }
    
    return {
        loadView: loadView,
        loadLogs: loadLogs,
        timeNow: timeNow,
        fileHash: getFileHash,
        dataDir: createDataDir,
        deleteFile: deleteFile
    };

}(streemio.util || {}));


streemio.Fdialog = (function (module) {
    
    var defOprions = {
        type: 'open',
        accept: [],
        path: null,
        defaultSavePath: null,
        element: null
    };
    
    function NoSelectedFile(message) {
        var err = new Error();
        err.name = 'NoSoelectedFile';
        err.message = message;
        err.stack = (new Error()).stack;
        
        return err;
    };
    
    module.initialize = function (options) {
        this._options = options;
        
        if (typeof this._options.window !== "undefined")
            this.window = this._options.window;
        
        if (!this.window) this.window = window || null;
        
        this.element = null;
    };
    
    
    module._createElement = function (changeeventfn) {
        
        var self = this;
        
        if (this.element)
            return this.element;
        
        this._pid = 0;
        
        this.element = this.window.document.createElement("input");
        this.element.type = 'file';
        this.element.style.display = 'none';
        
        if (this._options.path) {
            this.element.nwworkingdir = this._options.path;
        }
        
        if (this._options.type == 'save') {
            
            var nwsaveas = window.document.createAttribute("nwsaveas");
            
            if (this._options.defaultSavePath) {
                nwsaveas.value = this._options.defaultSavePath;
            }
            
            this.element.setAttributeNode(nwsaveas);

        } else if (this._options.type == 'directory') {
            // Future
            throw new Error("Not implemented");
        /*var nwdirectory = window.document.createAttribute('nwdirectory');
        this.element.setAttributeNode(nwdirectory);*/
        }
        
        if (this._options.path) {
            var nwworkingdir = window.document.createAttribute('nwworkingdir');
            nwworkingdir.value = this._options.path;
            
            this.element.setAttributeNode(nwworkingdir);

        }
        
        if (this._options.accept) {
            
            var accept = window.document.createAttribute('accept');
            accept.value = this._options.accept.join(',');
            
            this.element.setAttributeNode(accept);

        }
        
        return this.element;
    };
    
    
    /** Set window object (for element creation)
     * @param {Object} window    Window object
     */
    module.setWindow = function (window) {
        this.window = window;
    };
    
    /** Show dialog
     * @param {function} cb callback
     */
    module.create = function (cb, changeeventfn) {
        var element = this._createElement();
        cb = cb || function () { };
        cb(null, element);
    };
    
    /** Get a file path by a dialog
     * @param {function} cb callback
     */
    module.getFilePath = function (cb) {
        
        var self = this;
        
        self.create(function (err, element) {
            
            element.addEventListener('change', function (evt) {
                var files = evt.target.files;
                
                if (!files || !files.length) {
                    return cb(new NoSelectedFile("No file selected") , null);
                }
                
                element = null;
                self.element = null;
                
                cb(null, files[0]);

            });
            
            element.click();

        });
    };
    
    /** Get file content and path
     * @param {object} [options] Options to fs module
     * @param {function} cb callback
     */
    module.readFile = function (options, cb) {
        
        var self = this;
        
        if (typeof options == 'function') {
            cb = options;
            options = {};
        }
        
        self.getFilePath(function (err, file) {
            
            if (err) return cb(err);
            
            var reader = new FileReader();
            
            // Closure to capture the file information.
            reader.onload = (function (fileobj) {
                return function (e) {
                    cb(null, e.target.result, fileobj.name);
                };
            })(file);
            
            // Read in the image file as a data URL.
            reader.readAsDataURL(file);

            //fs.readFile(filepath, options, function (err, body) {
            //    cb(err, body, filepath);
            //});

        });

    };
    
    
    module.readTextFile = function (options, cb) {
        
        var self = this;
        
        if (typeof options == 'function') {
            cb = options;
            options = {};
        }
        
        self.getFilePath(function (err, file) {
            
            if (err) return cb(err);
            
            var reader = new FileReader();
            
            // Closure to capture the file information.
            reader.onload = (function (fileobj) {
                return function (e) {
                    cb(null, e.target.result, fileobj.name);
                };
            })(file);
            
            // Read in the image file as a data URL.
            reader.readAsText(file);

        });

    };
    
    
    module.saveTextFile = function (data, filename, cb) {
        
        saveAs(
            new Blob([data], { type: "text/plain;charset=" + document.characterSet }),
	        filename
        );
        
        cb();
    };
    
    return module;

}(streemio.Fdialog || {}));


streemio.UI = (function (module, logger, events, config) {
    
    module.messagesvm = null;
    
    module.showContacts = function () {
        $(".app-select-screen").hide();
        $(".appboot-screen").hide();
        $(".streemio-screen").show();    
        $('.contacts-tab').show();
        $("#main-container").css('left', 281);
    }
    
    module.set_account_title = function (account) {
        document.title = "Streemio - " + account;
        if (!streemio.Main.is_gui) {
            $(".menu-account-info").text(account);
            $(".nav-account-info").show();
        }
    }
    
    module.accept_call = function (sender, type, resultfn) {
        
        if (type != streemio.DEFS.CALLTYPE_VIDEO && type != streemio.DEFS.CALLTYPE_AUDIO) {
            return streemio.notify.error("Invalid call type received from " + sender);
        }
        
        var ctype;
        if (type == streemio.DEFS.CALLTYPE_VIDEO) {
            ctype = "video";
        }
        else {
            ctype = "audio";
        }
        var msg = "Incoming " + ctype + " call from " + sender + ". Accept call?";
        
        var audioctrl = document.getElementById('ringsound1');
        audioctrl.muted = false;
        audioctrl.play();
        $(".appboot-screen").hide(100, function () {
            $(".streemio-screen").show();
            
            bootbox.dialog({
                message: msg,
                title: "Incoming call",
                closeButton: false,
                buttons: {
                    danger: {
                        label: "Decline",
                        callback: function () {
                            audioctrl.pause();
                            audioctrl.muted = true;
                            resultfn(false);
                        }
                    },
                    success: {
                        label: "Accept",
                        callback: function () {
                            audioctrl.pause();
                            audioctrl.muted = true;
                            resultfn(true);
                        }
                    }
                }
            });
        });
    }
    
    module.accept_file = function (sender, file_name, file_size, callback) {
        var text = "Incoming file transfer from " + sender + ". File name: " + file_name + ".  File size: " + file_size + " bytes. Accept file?";
        bootbox.confirm(text, function (result) {
            callback(result);
        });
    }
    
    module.onAccountMsg = function (result) {

        if (!module.messagesvm) {
            module.messagesvm = new streemio.vms.MessagesViewModel();
        }
        
        if (!result)
            return;
        
        if (result.error) {
            return streemio.notify.error("Get offline messages error:  %j", e);
        }
        
        var count = result.count;
        var messages = result.messages;
        if (!messages || !messages.length)
            return;
        
        var processed = [];

        for (var i = 0; i < messages.length; i++) {
            //logger.debug("message: %j", messages[i]);
            var key = messages[i].key;
            if (!key)
                break;
            
            var keyarr = key.split("/");
            if (keyarr.length < 3)
                break;
            
            if (keyarr[0] != streemio.User.name || keyarr[1] != "message")
                break;
            
            var hash = keyarr[keyarr.length - 1];
            var value = messages[i].value;
            module.messagesvm.add_message(key, value);
        }
        
        if (module.messagesvm.messages().length > 0) {
            // navigate the to the messages view
            events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_ACCOUNT_MESSAGES);
        }
        else {
            logger.info("There are no messages on the network for " + streemio.User.name);
        }
    }
    
    module.NavigateInitUser = function () {
        events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER);
    }
    
    module.showLogs = function () {
        try {
            var content = $("#app-logs-template").html();
            streemio.util.loadLogs(function (err, result) {
                try {
                    if (err) {
                        return streemio.notify.error_popup(err);
                    }
                    
                    var istextlines = false;
                    var lines;
                    if ($.isArray(result)) {
                        lines = result;
                    }
                    else {
                        lines = result.split("\n");
                        istextlines = true;
                    }
                    
                    if (!lines || !lines.length) {
                        return bootbox.alert("The log file is empty");
                    }
                    
                    var errcount = 0;
                    var errors = [], infos = [], debugs = [];
                    if (!istextlines) {
                        for (var i = lines.length - 1; i >= 0; i--) {
                            try {
                                if (lines[i].level == "error") {
                                    errors.push(lines[i]);
                                }
                                else if (lines[i].level == "info") {
                                    infos.push(lines[i]);
                                }
                                else if (lines[i].level == "debug") {
                                    debugs.push(lines[i]);
                                }
                            }
                            catch (e) {
                                errcount++
                            }
                        }
                    }
                    else {
                        for (var i = lines.length - 1; i >= 0; i--) {
                            try {
                                if (lines[i].indexOf('"level":"error"') > -1) {
                                    var line = JSON.parse(lines[i]);
                                    errors.push(line);
                                }
                                else if (lines[i].indexOf('"level":"info"') > -1) {
                                    var line = JSON.parse(lines[i]);
                                    infos.push(line);
                                }
                                else if (lines[i].indexOf('"level":"debug"') > -1) {
                                    var line = JSON.parse(lines[i]);
                                    debugs.push(line);
                                }
                            }
                            catch (e) {
                                errcount++
                            }
                        }
                    }
                    
                    
                    
                    //
                    var vm = new streemio.vms.LogsViewModel();
                    vm.init(errors, infos, debugs);
                    
                    var dialog = new BootstrapDialog({
                        title: 'Application Logs',
                        message: content,                       
                        onshown: function (dlgwin) {
                            var logs_container = document.querySelector(".logs-view-container");
                            if (logs_container) {
                                ko.applyBindings(vm, logs_container);
                            }
                        }
                    });
                    
                    dialog.setSize(BootstrapDialog.SIZE_WIDE);
                    dialog.open();

                }
                catch (e) {
                    bootbox.alert("Error opening the logs: " + e.message);
                }
            });
        }
        catch (err) {
            bootbox.alert("Error opening the logs: " + err.message);
        }
    }
    
    module.showSendFile = function (contact) {
        
        var dialog = 0;
        
        var onInitEnd = function () {
            var container = document.querySelector(".modal-content");
            module.unblockui(container);
            if (dialog) {
                dialog.close();
            }
        }
        
        var onInitStart = function () {
            var container = document.querySelector(".modal-content");
            module.blockui(container, "Waiting for contact to accept the file ... ");
        }
        
        try {
            var vm = 0;
            var content = $("#send-file-template").html();
            //
            //var vm = new streemio.vms.LogsViewModel();
            
            dialog = new BootstrapDialog({
                title: 'Send File',
                message: content,
                buttons: [{
                        label: 'Cancel',
                        action: function (dlgwin) {
                            dlgwin.close();
                        }
                    }],
                onshown: function (dlgwin) {
                    var container = document.querySelector("#filesend-dlg-container");
                    if (container) {
                        vm = new streemio.vms.SendFileViewModel(contact, onInitStart, onInitEnd);
                        ko.applyBindings(vm, container);
                    }
                }
            });
            
            dialog.setSize(BootstrapDialog.SIZE_NORMAL);
            dialog.open();
        }
        catch (err) {
            bootbox.alert("Error in sending file: " + err.message);
        }
    }
    
    module.receiveFile = function (sender, file_params) {
        try {
            
            var contact = streemio.Contacts.get_contact(sender);
            var file = { size: file_params.file_size, name: file_params.file_name, type: file_params.file_type, hash: file_params.file_hash };
            var options = {
                contact: contact,
                file: file,
                is_sender: false
            };
            
            streemio.FileTransfer.init_receive(options);
            
            streemio.Session.tasksvm.add({
                type: "file",
                mode: "receive",
                file_name: file.name,
                hash: file.hash,
                file_size: file.size,
                file_type: file.type,
                contact: contact
            });

        }
        catch (err) {
            bootbox.alert("Error in receiveFile: " + err.message);
        }
    }
    
    module.showContactFiles = function (sender, blob, filename, filesize) {
        var dialog = 0;
        try {
            var vm = 0;
            var content = $("#contact-files-template").html();
            
            dialog = new BootstrapDialog({
                title: 'File from contact ' + sender,
                message: content,
                buttons: [{
                        label: 'Close',
                        action: function (dlgwin) {
                            var anchor = document.querySelector('.fileobj-url');
                            URL.revokeObjectURL(anchor.href);
                            dlgwin.close();
                        }
                    }],
                onshown: function (dlgwin) {
                    var anchor = document.querySelector('.fileobj-url');
                    anchor.href = URL.createObjectURL(blob);
                    anchor.download = filename;
                    anchor.textContent = 'Click to download \'' + filename + '\' (' + filesize + ' bytes)';
                    $(anchor).on("click", function () {
                        //URL.revokeObjectURL(anchor.href);                        
                        dlgwin.close();
                    });
                }
            });
            
            dialog.setSize(BootstrapDialog.SIZE_NORMAL);
            dialog.open();
        }
        catch (err) {
            bootbox.alert("Error in receiving file: " + err.message);
        }
    }
    
    module.blockui = function (element, msg) {
        $(element).block({
            message: msg || "Processing ...",
            css: {
                border: 'none', 
                padding: '10px', 
                backgroundColor: '#000', 
                'border-radius': '10px',
                '-webkit-border-radius': '10px', 
                opacity: .7, 
                color: '#fff'
            }
        });
    }
    
    module.unblockui = function (element) {
        $(element).unblock();
    }
    
    module.show_about = function (element) {
        var content = $("#streemio-view-about").html();
        var box = bootbox.dialog({
            title: "About Streemio", 
            message: content,
            buttons: {
                close: {
                    label: "Close",
                    className: "btn-default",
                    callback: function () {
                    }
                }
            }
        });
    }
    
    return module;

}(streemio.UI || {}, streemio.logger, global.appevents));


streemio.notify = (function (module) {
    
    var m_notify = 0;
    
    module.taskbar_timer = 0;
    
    function get_err_msg(err, param) {
        
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
    }
    
    function get_msg(msg, param) {
        var result = msg;
        if (param) {
            if (typeof msg == 'string' && msg.indexOf("%s") > -1) {
                result = util.format(msg, param);
            }
        }
        
        return result;
    }
    
    module.error = function (err, param, title, time) {
        if (!err) {
            return;
        }
        
        var msg = get_err_msg(err, param);
        logger.error(msg);
        
        module.taskbarmsg(msg);
        
        return msg;
    }
    
    module.error_popup = function (err, param, title, time) {
        if (!err) {
            return;
        }
        
        var msg = get_err_msg(err, param);
        
        m_notify = $.notify(
            {
                title: title ? ("<strong>" + title + "</strong> ") : '',
                message: msg
            }, 
            {
                type: 'danger',
                delay: time ? time :12000
            }
        );
        
        logger.error(msg);
        
        return msg;
    }
    
    module.info = function (msg, param, title, time) {
        var text = get_msg(msg, param);
        m_notify = $.notify(
            {
                title: title ? ("<strong>" + title + "</strong> ") : '',
                message: text
            }, 
            {
                type: 'info',
                delay: time ? time : 8000
            }
        );
        logger.info(text);
    }
    
    module.info_panel = function (msg, param, title, time) {
        var text = get_msg(msg, param);
        m_notify = $.notify(
            {
                title: title ? ("<strong>" + title + "</strong> ") : '',
                message: text
            }, 
            {
                type: 'info',
                delay: time ? time : 6000
            }
        );
    }
    
    module.success = function (msg, param, title, time) {
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
        logger.debug(text);
    }
    
    module.showprogress = function (msg) {
        $(".app-error-indicator-panel").hide();
        $('.app-progress-msg').text(msg);
        $('#app-progress').show();
    }
    
    module.hideprogress = function () {
        $('.app-progress-msg').text("");
        $('#app-progress').hide();
    }
    
    module.hide = function () {
        try {
            m_notify.close();
        }
        catch (e) { }
    }
    
    module.taskbarmsg = function (msg) {
        if (module.taskbar_timer) {
            clearTimeout(module.taskbar_timer);    
        }

        $("#txt-taskbar-info").text(msg);
        module.taskbar_timer = setTimeout(function () {
            $("#txt-taskbar-info").text("");
            clearTimeout(module.taskbar_timer);
            module.taskbar_timer = 0;
        }, 15000);
    }
    
    return module;

}(streemio.notify || {}));


streemio.User = (function (usrobj, events) {
    
    var m_name = null;
    var key = null;
    var ecdhkey = null;
    var m_port = null;
    var m_address = null;
    var m_ecdhkeys = null;
    var m_lastpkey = null;
    
    Object.defineProperty(usrobj, "name", {
        get: function () {
            return m_name;
        },
        
        set: function (value) {
            m_name = value;
        }
    });
    
    Object.defineProperty(usrobj, "port", {
        get: function () {
            return m_port;
        },
        
        set: function (value) {
            m_port = value;
        }
    });
    
    Object.defineProperty(usrobj, "address", {
        get: function () {
            return m_address;
        },
        
        set: function (value) {
            m_address = value;
        }
    });
    
    Object.defineProperty(usrobj, "crypto_key", {
        get: function () {
            return key;
        },
        
        set: function (value) {
            key = value;
        }
    });
    
    Object.defineProperty(usrobj, "private_key", {
        get: function () {
            return key ? key.privateKey : '';
        }
    });
    
    Object.defineProperty(usrobj, "ecdh_key", {
        get: function () {
            return ecdhkey;
        },
        
        set: function (value) {
            ecdhkey = value;
        }
    });
    
    Object.defineProperty(usrobj, "ecdh_public_key", {
        get: function () {
            return ecdhkey ? ecdhkey.getPublicKey('hex') : '';
        }
    });
    
    Object.defineProperty(usrobj, "ecdh_private_key", {
        get: function () {
            return ecdhkey ? ecdhkey.getPrivateKey('hex') : '';
        }
    });
    
    Object.defineProperty(usrobj, "public_key", {
        get: function () {
            return key ? key.publicKeyStr : '';
        }
    });
    
    Object.defineProperty(usrobj, "last_public_key", {
        get: function () {
            return m_last_key;
        },
        
        set: function (value) {
            m_last_key = value;
        }
    });
    
    Object.defineProperty(usrobj, "is_user_initialized", {
        get: function () {
            var isuser = m_name && key && ecdhkey;
            return isuser ? true : false;
        }
    });
    
    Object.defineProperty(usrobj, "ecdhkeys", {
        get: function () {
            return m_ecdhkeys;
        },
        
        set: function (value) {
            m_ecdhkeys = value;
        }
    });
    
    function getCryptPassword(password, account) {
        var text = password + account;
        var salt = nodecrypto.createHash('sha1').update(text).digest().toString('hex');
        var pbkdf2key = nodecrypto.pbkdf2Sync(text, salt, 100, 64, 'sha512');
        var pwdhex = pbkdf2key.toString('hex');
        return pwdhex;
    }
    
    function addToDB(account, publickey, cipher_context, callback) {
        var user = {
            "account": account, 
            "public_key": publickey,
            "cipher": cipher_context
        };
        
        streemio.AccountsDB.put(user, function (err) {
            if (err) {
                return streemio.notify.error("Database update error %j", err);
            }
            
            logger.debug("database user updated");
            
            if (callback) {
                callback();
            }
        });
    }
    
    usrobj.create_account = function (account, password, callback) {
        try {

            if (!account || !password)
                throw new Error("create_account invalid parameters");
            
            var pbkdf2 = getCryptPassword(password, account);
            
            // get an entropy for the ECC key
            var entropy = secrand.randomBuffer(32).toString("hex");
            
            // create ECC key
            var key = new EccKey(entropy);
            
            // create a ECDH key
            var ecdh_key = nodecrypto.createECDH('secp256k1');
            ecdh_key.generateKeys();
            
            //  encrypt this
            var user_context = {
                "pk_entropy": entropy,
                "timestamp": Date.now(),
                "ecdhkeys": []
            };
            
            user_context.ecdhkeys.push({
                ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                ecdh_public_key: ecdh_key.getPublicKey('hex')
            });
            
            var cipher_context = streemio.Message.aes256encrypt(pbkdf2, JSON.stringify(user_context));
            
            addToDB(account, key.publicKeyStr, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.ecdh_key = ecdh_key;
                usrobj.name = account;
                usrobj.ecdhkeys = user_context.ecdhkeys;
                
                events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);
                
                streemio.UI.set_account_title(account);
                
                callback();
            });
        }
        catch (err) {
            logger.error("create_account error %j", err);
            callback(err);
        }
    };
    
    usrobj.initialize = function (user, password, callback) {
        try {
            if (!user || !password) {
                return streemio.notify.error_popup("Invalid parameters, the account and passwords are required");
            }
            
            var account_name = user.account;
            if (!account_name) {
                return streemio.notify.error_popup("Invalid account name");
            }
            
            var pbkdf2 = getCryptPassword(password, account_name);
            
            // decrypt the cipher
            var plain_text;
            try {
                plain_text = streemio.Message.aes256decrypt(pbkdf2, user.cipher);
            }
            catch (err) {
                if (err.message && err.message.indexOf("bad decrypt") > -1) {
                    return streemio.notify.error_popup("User initialize error: incorrect password");
                }
                else {
                    return streemio.notify.error_popup("User initialize error: %j", err);
                }
            }
            
            var userobj = JSON.parse(plain_text);
            
            var entropy = userobj.pk_entropy;
            
            // create ECC key
            var key = new EccKey(entropy);
            
            if (key.publicKeyStr != user.public_key) {
                return streemio.notify.error_popup("Error in initializing the account, invalid password");
            }
            
            // the account exists and the encrypted entropy is correct!
        
            if (!userobj.ecdhkeys) {
                userobj.ecdhkeys = [];
            }

            var ecdh_key = nodecrypto.createECDH('secp256k1');
           
            if (userobj.ecdhkeys.length == 0) {
                // create a ECDH key
                ecdh_key.generateKeys();
                
                userobj.timestamp = Date.now();
                userobj.ecdhkeys.push({
                    ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                    ecdh_public_key: ecdh_key.getPublicKey('hex')
                });
            }
            else {
                try {
                    var ecdhprivate = userobj.ecdhkeys[0].ecdh_private_key;
                    ecdh_key.setPrivateKey(ecdhprivate, 'hex');
                }
                catch (e) {
                    userobj.ecdhkeys = [];
                    ecdh_key.generateKeys();                    
                    userobj.timestamp = Date.now();
                    userobj.ecdhkeys.push({
                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                    });
                    streemio.notify.error("ECDH exception occured when setting private key. New ECDH array is created");
                }
            }
            
            var cipher_context = streemio.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));
            
            addToDB(account_name, key.publicKeyStr, cipher_context, function () {
                
                usrobj.crypto_key = key;
                usrobj.ecdh_key = ecdh_key;
                usrobj.name = account_name;
                usrobj.ecdhkeys = userobj.ecdhkeys;
                
                events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);
                
                streemio.UI.set_account_title(account_name);
                
                callback();
            });
                //}
                //catch (err) {
                //    streemio.notify.error_popup("User initialize error: %j", err);
                //}
          //  });                       
        }
        catch (err) {
            streemio.notify.error_popup("User initialize error: %j", err);
        }
    };
    
    usrobj.backup = function () {
        try {
            if (!usrobj.name) {
                throw new Error("the account is not initialized");
            }
            
            streemio.AccountsDB.get(usrobj.name, function (err, user) {
                if (err) {
                    throw new Error(err);
                }
                if (!user) {
                    throw new Error("The account does not exists");
                }
                
                streemio.Fdialog.initialize({
                    type: 'save',
                    accept: ['streemio.dat'],
                    path: '~/Documents',
                    defaultSavePath: 'streemio.dat'
                });
                
                var objext = JSON.stringify(user);
                var encoded = window.btoa(objext);
                
                var text = "---BEGIN STREEMIO KEY---\n";
                text += encoded;
                text += "\n---END STREEMIO KEY---";
                
                var file_name = "streemio_" + usrobj.name + ".dat";
                streemio.Fdialog.saveTextFile(text, file_name, function () {
                    logger.debug("File saved in", path);
                });
                
            });
        }
        catch (err) {
            streemio.notify.error_popup("Account backup error: %j", err);
        }
    };
    
    usrobj.restore = function () {
        try {
            var user = null;
            var account = null;
            
            streemio.Fdialog.initialize({
                type: 'open',
                accept: ['.dat'],
                path: '~/Documents'
            });
            
            streemio.Fdialog.readTextFile(function (err, buffer, path) {
                var text = null;
                try {
                    if (!buffer) {
                        throw new Error("invalid key backup buffer");
                    }
                    
                    var data = buffer.toString();
                    var find1 = "---BEGIN STREEMIO KEY---\n";
                    var pos1 = data.indexOf(find1);
                    if (pos1 == -1) {
                        throw new Error("invalid key backup data");
                    }
                    var pos2 = data.indexOf("\n---END STREEMIO KEY---");
                    if (pos2 == -1) {
                        throw new Error("invalid key backup data");
                    }
                    
                    var start = find1.length;
                    var decoded = data.substring(start, pos2);
                    text = window.atob(decoded);
                }
                catch (e) {
                    return streemio.notify.error_popup("Invalid key backup data. Error: %j", e);
                }
                
                if (!text) {
                    return streemio.notify.error_popup("Invalid key backup data");
                }
                
                user = JSON.parse(text);
                account = user.account;
                
                // get the password
                var box = bootbox.dialog({
                    title: "Private key password", 
                    message: '<div class="row"><div class="col-md-12">   ' +
                    '<input id="privkeypwd" name="privkeypwd" type="password" class="form-control input-md"> ' +
                    '</div></div>',
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: 'btn-default',
                            callback: function () {
                                
                            }
                        },
                        success: {
                            label: "Login",
                            className: 'btn-default',
                            callback: function () {
                                try {
                                    var result = $('#privkeypwd').val();
                                    if (result === null) {
                                        return bootbox.alert("Enter the private key password!");
                                    }
                                    
                                    var pbkdf2 = getCryptPassword(result, account);
                                    
                                    // decrypt the cipher
                                    var plain_text = streemio.Message.aes256decrypt(pbkdf2, user.cipher);
                                    var userobj = JSON.parse(plain_text);
                                    
                                    var entropy = userobj.pk_entropy;
                                    
                                    // create ECC key
                                    var key = new EccKey(entropy);
                                    
                                    if (key.publicKeyStr != user.public_key) {
                                        return bootbox.alert("Error in initializing the account, invalid password");
                                    }
                                    
                                    // the account exists and the encrypted entropy is correct!
                                    
                                    // create a ECDH key
                                    var ecdh_key = nodecrypto.createECDH('secp256k1');
                                    ecdh_key.generateKeys();
                                    
                                    userobj.timestamp = Date.now();
                                    userobj.ecdhkeys.push({
                                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                                    });
                                    
                                    if (userobj.ecdhkeys.length > 5) {
                                        userobj.ecdhkeys.shift();
                                        if (userobj.ecdhkeys.length > 5) {
                                            var removecount = userobj.ecdhkeys.length - 5;
                                            userobj.ecdhkeys.splice(0, removecount);
                                        }
                                    }
                                    
                                    var cipher_context = streemio.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));
                                    
                                    addToDB(account, key.publicKeyStr, cipher_context, function (err) {
                                        
                                        usrobj.crypto_key = key;
                                        usrobj.ecdh_key = ecdh_key;
                                        usrobj.name = account;
                                        usrobj.ecdhkeys = userobj.ecdhkeys;
                                        
                                        events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);
                                        
                                        streemio.UI.set_account_title(account);
                                        
                                        streemio.notify.success("The account has been initialized");
                                        events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_EMPTY_SCREEN);

                                    });
                                }
                                catch (e) {
                                    bootbox.alert("Error in initializing the account: " + e.message);
                                }
                            }
                        }
                    }
   
                });
            });
                
            
        }
        catch (e) {
            streemio.notify.error_popup("Account restore error: %j", e);
        }
    };
    
    usrobj.update_public_key = function (new_key_password) {
        logger.debug("Publish update_public_key");
        
        try {
            if (!usrobj.is_user_initialized) {
                return streemio.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streemio network.");
            }
            
            if (!new_key_password) {
                return streemio.notify.error("Invalid parameters, the passphrase is required");
            }
            
            var current_public_key = usrobj.public_key;
            if (!current_public_key) {
                return streemio.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streemio network.");
            }
            
            var account = usrobj.name;
            if (!account) {
                return streemio.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streemio network.");
            }
            
            var pbkdf2 = getCryptPassword(new_key_password, account);
            
            // get an entropy for the ECC key
            var entropy = secrand.randomBuffer(32).toString("hex");
            
            // create ECC key
            var key = new EccKey(entropy);
            var new_public_key = key.publicKeyStr;
            
            logger.debug("Updating public key on the network");
            streemio.PeerNet.update_public_key(new_public_key, function (err) {
                if (err) {
                    return streemio.notify.error_popup("Publish updated public key error %j", err);
                }
                
                //  encrypt this
                var user_context = {
                    "pk_entropy": entropy,
                    "timestamp": Date.now(),
                    "ecdhkeys": usrobj.ecdhkeys
                };
                
                var cipher_context = streemio.Message.aes256encrypt(pbkdf2, JSON.stringify(user_context));
                
                addToDB(account, new_public_key, cipher_context, function () {
                    usrobj.crypto_key = key;
                    
                    streemio.notify.success("The public key has been updloaded to the network");
                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_EMPTY_SCREEN);
                });
            });
        }
        catch (err) {
            streemio.notify.error("User initialize error: %j", err);
            callback(err);
        }
    }
    
    usrobj.clear = function () {
        usrobj.crypto_key = null;
        usrobj.name = null;
        usrobj.ecdh_key = null;
    }
    
    return usrobj;

}(streemio.User || {}, global.appevents));


streemio.Session = (function (module, logger, events, config) {
    
    module.settings = {};
    module.current_operation = 0;
    module.selected_contact = 0;
    module.data_context = 0;
    module.curent_viewmodel = 0;
    module.contactsvm = 0;
    module.mainvm = 0;
    module.tasksvm = 0;
    module.textmessages = {};
    
    module.add_textmsg = function (contact, msg) {
        if (!module.textmessages[contact]) {
            module.textmessages[contact] = [];
        }
        
        var array = module.textmessages[contact];
        array.push(msg);
    }
    
    module.get_textmsg = function (contact) {
        if (!module.textmessages[contact]) {
            module.textmessages[contact] = [];
        }
        
        return module.textmessages[contact];
    }
    
    module.update_settings = function (data, callback) {
        if (!data) {
            return callback("invalid settings, the data field must exist.");                
        }

        var newsettings = {
            key: "settings", 
            data: data
        }; 

        streemio.DB.update(streemio.DB.SETTINGSDB, newsettings).then(
            function () {
                logger.debug("added database settings");
                module.settings = newsettings;
                // assign the new settings to the global config
                streemio.config.set_config(module.settings.data);
                callback(null);
            },
            function (err) {
                logger.error("add database settings error %j", err);
                callback(err);
            }
        );
    }
    
    module.get_settings = function (callback) {
        streemio.DB.get(streemio.DB.SETTINGSDB, "settings").then(
            function (result) {
                logger.debug("database result populated");
                if (result && result.data) {
                    module.settings = result.data;
                }
                callback();           
            },
            function (err) {
                logger.error("streemio.DB.get settings error %j", err);
                callback(err);
            }
        );
    }

    module.get_pending_contact = function (account) {
        var pending_contact = null;
        try {
            if (module.settings.data.pending_contacts) {
                for (var i = 0; i < module.settings.data.pending_contacts.length; i++) {
                    if (module.settings.data.pending_contacts[i].name == account) {
                        pending_contact = module.settings.data.pending_contacts[i];
                        break;
                    }
                }
            }
            
            return pending_contact
        }
        catch (e) {
            logger.error("get_pending_contact error. Exception %j", e);
            callback(e);
        }
    }
    
    module.delete_pending_contact = function (contact_name, callback) {
        try {
            if (module.settings.data.pending_contacts) {
                var contacts = [];
                for (var i = 0; i < module.settings.data.pending_contacts.length; i++) {
                    if (module.settings.data.pending_contacts[i].name != contact_name) {
                        contacts.push(module.settings.data.pending_contacts[i]);
                    }
                }
                module.settings.data.pending_contacts = contacts;
            }
            else {
                module.settings.data.pending_contacts = [];           
            }

            streemio.DB.update(streemio.DB.SETTINGSDB, module.settings).then(
                function () {
                    logger.debug("updated settings database");
                    if (callback) {
                        callback(null);
                    }
                },
                function (err) {
                    logger.error("add database settings error %j", err);
                    if (callback) {
                        callback(err);
                    }
                }
            );
        }
        catch (e) {
            logger.error("add database settings error. Exception %j", e);
            if (callback) {
                callback(e);
            }
        }
    }

    module.add_pending_contact = function (contact, callback)  {
        if (!module.settings.data.pending_contacts) {
            module.settings.data.pending_contacts = [];           
        }
        
        var exists = false;
        for (var i = 0; i < module.settings.data.pending_contacts.length; i++) {
            if (module.settings.data.pending_contacts[i].name == contact.name) {
                //update the timestamps of the add contact request
                contact.addrequest_create = module.settings.data.pending_contacts[i].addrequest_create;
                contact.addrequest_update = new Date().getTime();
                module.settings.data.pending_contacts[i] = contact;
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            contact.addrequest_create = new Date().getTime();
            module.settings.data.pending_contacts.push(contact);
        }

        streemio.DB.update(streemio.DB.SETTINGSDB, module.settings).then(
            function () {
                logger.debug("updated settings database");
                callback(null);
            },
            function (err) {
                logger.error("add database settings error %j", err);
                callback(err);
            }
        );
    }
    
    module.add_blocked_contact= function (contact_name, callback)  {
        if (!module.settings.blocked_contacts) {
            module.settings.blocked_contacts = [];
        }
        module.settings.blocked_contacts.push(contact_name);
        
        streemio.DB.update(streemio.DB.SETTINGSDB, module.settings).then(
            function () {
                logger.debug("updated settings database");
                callback(null);
            },
            function (err) {
                logger.error("add database settings error %j", err);
                callback(err);
            }
        );
    }
    
    return module;

}(streemio.Session || {}, streemio.logger, global.appevents, streemio.config));


streemio.Contacts = (function (module, logger, events, config) {
    
    var contacts = [];
    var pending_contacts = {};
    
    var Contact = function (param) {
        var contobj = {
            isonline: ko.observable(false),
            lastping: ko.observable(0),
            errors: [],
            public_key: "", 
            ecdh_public: "", 
            address: "", 
            port: 0, 
            name: "",                    
            protocol: "",
            user_type: "",
            
            ping: function () {
                var _self = this;
               
                streemio.PeerNet.ping(this, false, 45000)    
                .then(
                    function () {
                        _self.lastping(Date.now());
                        _self.isonline(true);
                        logger.debug("contact " + _self.name + " is online");
                    },
                    function (err) {
                        _self.lastping(Date.now());
                        _self.isonline(false);
                        //  if the contact is offline then that is not an error 
                        if ((typeof err == 'string' && err.indexOf("TIMEDOUT") > -1) || (err.message && err.message.indexOf("TIMEDOUT") > -1)) {
                            logger.debug("Ping to contact " + self.name + " timed out");
                        }
                        else {
                            _self.errors.push(util.format("Ping to contact error: %j", err));
                        }
                    }
                );
            }
        };
        
        if (param) {
            for (var prop in param) {
                contobj[prop] = param[prop];
            }
        }
        
        return contobj;
    };
    
    function update_contact_database (contact, callback) {
        streemio.DB.update(streemio.DB.CONTACTDB, contact).then(
            function () {
                callback();
            },
            function (err) {
                streemio.notify.error("Populate contact error %j", err);
            }                        
        );
    };
    
    function on_contact_online(account, contobj) {
        try {            
            var contact = module.get_contact(account);
            if (!contact) return;
            
            //  parse the message
            //  mus use the existing public key which guarantees data integrity and that the 
            //  contact is indeed the sender
            var public_key = module.get_public_key(account);
            var payload = streemio.Message.decode(contobj.value, contact.public_key);
            var incoming_contact = payload.data;
            if (incoming_contact.public_key != contact.public_key) {
                streemio.notify.error("Invalid contact received from the network. Contact '" + account + "' will be removed from the contact list");
                // remove from the list
                streemio.Session.contactsvm.delete_byname(contact.name);
                //  remove from the local db
                return module.remove(account);
            }
            
            contact.address = incoming_contact.address;
            contact.port = incoming_contact.port;
            contact.ecdh_public = incoming_contact.ecdh_public;
            
            var updobj = {
                public_key: incoming_contact.public_key, 
                ecdh_public: incoming_contact.ecdh_public, 
                address: incoming_contact.address, 
                port: incoming_contact.port, 
                name: account,
                protocol: incoming_contact.protocol ? incoming_contact.protocol : streemio.DEFS.TRANSPORT_TCP,
                user_type: contact.user_type
            };
            
            update_contact_database(updobj, function () {
                module.on_online(account);
            });
        }
        catch (err) {
            streemio.notify.error("on_contact_online() error: %j", err);
        }
    }
    
    function pending_contact_handler() {
        var pcontacts = streemio.Session.settings.data.pending_contacts;
        if (!pcontacts || !pcontacts.length) {
            return;
        }

        var index = 0;
        var pctimer = setInterval(
            function () {
                var account = pcontacts[index].name;
                module.search(account, function (contact) {
                    module.send_addcontact_request(contact, function () {
                    });
                });

                index++;
                if (index >= pcontacts.length) {
                    clearTimeout(pctimer);
                }
            },
            5000
        );
    }
    
    function update_contact(account, obj) {
        if (!account || !obj) {
            return streemio.notify.error("update_contact error: invalid parameters");
        }

        var contact = module.get_contact(account);
        if (!contact) return;
        
        if (obj.public_key != contact.public_key) {
            streemio.notify.error("update_contact error. Invalid contact received from the network. Contact " + account + " will be removed from the contact list");
            // remove from the list
            streemio.Session.contactsvm.delete_byname(contact.name);
            //  remove from the local db
            return module.remove(account);
        }
        
        contact.address = obj.address;
        contact.port = obj.port;
        contact.ecdh_public = obj.ecdh_public;
        contact.protocol = obj.protocol  ? obj.protocol : streemio.DEFS.TRANSPORT_TCP;
        contact.user_type = obj.user_type;

        logger.debug("contact " + account + " populated from network and updated");
    }
    
    function find_contact_onnetwork(contact_address, contact_port, contact_name, callback) {
        streemio.PeerNet.find_contact(contact_name, function (err, contact) {
            if (err) {
                streemio.notify.error("Contact search error %j", err);
                return callback();
            }
            if (!contact) {
                streemio.notify.error("Couldn't find contact " + contact_name + " on the network");
                return callback();
            }
            
            if (contact_address && contact_port) {
                //  the NOED_FIND Kademlia call returned a contact which could be more current than 
                //  the stored contact so use the current address info
                contact.address = contact_address;
                contact.port = contact_port;
            }
            
            callback(contact);
            //
        });
    }
    
    function ping_contact(account) {
        if (!account) {
            return streemio.notify.error("ping_contact error: invalid parameters");
        }
        
        var contact = module.get_contact(account);
        if (!contact) return;
        
        contact.ping();
        
        logger.debug("ping contact " + account);
    }

    function init_contact(param_contact, callback) {
        var contact_name = param_contact.name;
        logger.debug("intialzing, find contact " + contact_name);
        
        streemio.Node.find_account(contact_name)
            .then(
            function (rescontacts) {
                var contact_address = null;
                var contact_port = null;
                if (rescontacts && rescontacts.length > 0) {
                    for (var i = 0; i < rescontacts.length; i++) {
                        if (contact_name != rescontacts[i].account) {
                            continue;
                        }
                        
                        contact_address = rescontacts[i].address;
                        contact_port = rescontacts[i].port;
                        break;
                    }
                }
                
                find_contact_onnetwork(contact_address, contact_port, contact_name, function (contact) {
                    if (!contact) {
                        setTimeout(function () {
                            callback();
                        }, 3000);
                        return;
                    }

                    streemio.notify.taskbarmsg("Found " + contact.name + " contact data on network");

                    streemio.DB.update(streemio.DB.CONTACTDB, contact).then(
                        function () {
                            update_contact(contact.name, contact);
                            ping_contact(contact.name);
                            streemio.Session.contactsvm.update_contact(contact.name, contact);
                            
                            setTimeout(function () {
                                callback();
                            }, 3000);
                        },
                        function (err) {
                            streemio.notify.error("Database update add contact error %j", err);

                            setTimeout(function () {
                                callback();
                            }, 3000);
                        }                        
                    );
                });
                            
            },
            function (err) {
                // use the stored contact info
                logger.error("find_account error: %j", err);
            }
        )
    }
    
    function init_contacts() {
        async.eachSeries(contacts, init_contact, function (err) {
            var msg = "Contacts initialization";
            if (err) {
                msg += " error: " + err;
            }
            else {
                msg += " completed.";
            }
            streemio.notify.taskbarmsg(msg);

            // get the offline messages
            var key = streemio.User.name + "/message";
            streemio.PeerNet.get_account_messages(key);

        });
    }
    
    module.on_receive_addcontact = function (request) {
        var account = request.name;
        
        //  if it exists then return the accept add contact
        if (module.exists(account)) {
            var existing_contact = module.get_contact(account);
            var existing_publickey = existing_contact.public_key;
            if (existing_publickey != request.public_key) {
                streemio.notify.error("Add contact request from " + account + " received an invalid public key: " + request.public_key)
            }
            else {
                existing_contact.address = request.address;
                existing_contact.port = request.port;
                existing_contact.protocol = request.protocol;
                // the contact already exists -> send back an accept contact message
                streemio.PeerNet.send_accept_addcontact_reply(existing_contact);
            }
        }
        else {
            module.search(account, function (contact) {
                if (contact.public_key != request.public_key || contact.user_type != request.user_type) {
                    return streemio.notify.error("Add contact request from " + account + " recieved with invalid public key");
                }
                contact.address = request.address;
                contact.port = request.port;
                contact.protocol = request.protocol;
                streemio.Session.contactsvm.onReceiveAddContact(contact);
            });
        }
    }
    
    module.decline_contact = function (contact) {
        try {
            streemio.PeerNet.send_decline_addcontact_reply(contact);
        }
        catch (err) {
            streemio.notify.error("decline_contact() error %j", err);
        }
    }
    
    //  Call this when the UI receives an add contact request 
    //  and the user accept it
    module.accept_contact = function (contact) {
        streemio.DB.update(streemio.DB.CONTACTDB, contact).then(
            function () {
                var contobj = new Contact(contact);
                contacts.push(contobj);
                streemio.Session.contactsvm.add_contact(contobj);                
                // send the contact accepted reply
                streemio.PeerNet.send_accept_addcontact_reply(contact);
            },
            function (err) {
                streemio.notify.error("Database update add contact error %j", err);
            }                        
        );
    }
    
    //  Call this when the contact returns via the network an accept add contact reply
    //  or when the contact sends an exchange key message 
    module.handle_addcontact_accepted = function (account) {
        var contact = pending_contacts[account];
        if (contact) {
            var contobj = new Contact(contact);
            contacts.push(contobj);
            streemio.DB.update(streemio.DB.CONTACTDB, contact).then(
                function () {                   
                    // add to the viewmodel
                    streemio.Session.contactsvm.add_contact(contobj);
                    
                    // delete from the database
                    streemio.Session.delete_pending_contact(account, function () {
                        delete pending_contacts[account];
                    });

                    // ping to the contact
                    contobj.ping();
                },
                function (err) {
                    streemio.notify.error("Database update add contact error %j", err);
                }                        
            );
        }
    }
    
    module.handle_addcontact_denied = function (account) {
        streemio.Session.delete_pending_contact(account, function () {
            delete pending_contacts[account];
        });
        streemio.notify.info_panel("Contact " + account + " has denied your add contact request");
    }
    
    module.send_addcontact_request = function (contact, callback) {
        //  refresh the pending contacts database
        streemio.Session.add_pending_contact(contact, function (err) {
            if (err) {
                return streemio.notify.error("error in adding contact: %j", err)
            }

            var account = contact.name;
            streemio.PeerNet.send_addcontact_request(contact);
            logger.info("Sending contact request to %s.", account);
            pending_contacts[account] = contact;
            callback();

            //  check here if the contact request was accepted
            //  put a persistent message if the contact request was still pending 
            setInterval(
                function () {
                    var pendingc = pending_contacts[account];
                    if (pendingc) {
                        streemio.PeerNet.send_offline_message(pendingc, function () { });
                    }
                },
                30000
            );
        });        
    }
    
    module.get_contact = function (account) {
        var contact = null;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                contact = contacts[i];
                break;
            }
        }
        return contact;
    }
    
    module.get_public_key = function (account) {
        var pk = null;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                pk = contacts[i].public_key;
                break;
            }
        }
        return pk;
    }
    
    module.exists = function (account) {
        var isexists = false;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                isexists = true;
                break;
            }
        }
        return isexists;
    }
    
    module.remove = function (name, callback) {
        streemio.DB.del(streemio.DB.CONTACTDB, name).then(
            function () {
                var pos = contacts.map(function (e) { return e.name; }).indexOf(name);
                contacts.splice(pos, 1);
                if (callback) {
                    callback();
                }
            },
            function (err) {
                streemio.notify.error("streemio.DB.clear error %j", err);
            }
        );
    }
    
    module.search = function (account, callback) {
        try {
            logger.debug("search " + account);
            streemio.PeerNet.find_contact(account, function (err, contact) {
                if (err) {
                    return streemio.notify.error_popup('The contact search for account "' + account + '" returned no result');
                }

                callback(contact);
                                
            });
        }
        catch (err) {
            streemio.notify.error("Contact search error %j", err)
        }
    }
    
    module.on_online = function (account) {
        var contact = module.get_contact(account);
        if (contact) {
            contact.isonline(true);
        }
    }
    
    module.init = function () {
        try {
            streemio.DB.getall(streemio.DB.CONTACTDB, function (err, result) {
                if (err) {
                    return streemio.notify.error("streemio.DB.getall CONTACT error %j", err);
                }
                
                for (var i = 0; i < result.length; i++) {
                    var exists = false;
                    var contact = result[i];
                    for (var j = 0; j < contacts.length; j++) {
                        if (contact.name == contacts[j].name) {
                            exists = true;
                            break;
                        }
                    }
                    if (exists) {
                        continue;
                    }
                    
                    // add to the contacts list
                    var contobj = new Contact(contact);
                    contacts.push(contobj);           
                }

                //
                streemio.Session.contactsvm.init(contacts);
                
                // iterate through the contacts and ping them
                init_contacts();

                setTimeout(
                    function () {
                        // start the pending contact handler
                        pending_contact_handler();
                    },
                    10000
                ); 
                
            });
        }
        catch (err) {
            streemio.notify.error("Error in initializing contacts: %j", err);
        }
    }
    
    module.list_of_contacts = function () {
        return contacts;
    }

    return module;

}(streemio.Contacts || {}, streemio.logger, global.appevents, streemio.config));


streemio.Main = (function (module, logger, events, config) {
    
    module.is_gui = global.appgui != null;
    module.is_app_initialized = false;
    module.is_node_initialized = false;
    module.network_type = streemio.DEFS.PUBLIC_NETWORK;
    module.private_net_seed = 0;
    module.app_command = 0;
    module.upnp_gateway = "";
    module.upnp_local_address = "";
    module.seeds = [];
    
    function show_active_app_screen() {
        $(".app-select-screen").hide();
        $(".appboot-screen").hide();
        $(".streemio-screen").show();    
    }
    
    function display_new_account() {
        show_active_app_screen();
        module.app_command = streemio.DEFS.CMD_APP_CREATEACCOUNT;
        events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: true });
    }

    function start_new_account() {
        if (streemio.Node.is_node_connected() == true) {
            display_new_account();
        }
        else {
            var seeds = config.bootseeds;
            module.join_to_network(seeds, true, function () {
                display_new_account();
            });
        }
    }
    
    function onSeedConnect(node) {
        logger.debug("peer seed is connected %j", node);
    }

    module.initMenu = function () {
        
        if (!module.is_gui) {
            streemio.Menu.initMenu();
            return;
        }
        
        var win = gui.Window.get();
        var menubar = new gui.Menu({ type: 'menubar' });
        var streemioMenu = new gui.Menu();
        
        streemioMenu.append(new gui.MenuItem({
            label: 'Start Streemio',
            click: function () {
                $(".appboot-screen").hide();
                $(".streemio-screen").hide();
                $(".app-select-screen").show();
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Connect to public network',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    show_active_app_screen();
                    module.network_type = streemio.DEFS.PUBLIC_NETWORK;
                    module.app_command = streemio.DEFS.CMD_APP_JOINPUBLICNET;
                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
                }            
                else {
                    logger.debug("Publish user to public network");
                    var seeds = config.bootseeds;
                    module.join_to_network(seeds);
                }
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Connect to private hub',
            click: function () {
                show_active_app_screen();
                module.network_type = streemio.DEFS.PRIVATE_NETWORK;
                module.app_command = streemio.DEFS.CMD_APP_JOINPRIVATENET;
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
            }
        }));
        streemioMenu.append(new gui.MenuItem({ type: 'separator' }));
        streemioMenu.append(new gui.MenuItem({
            label: 'New account',
            click: function () {
                start_new_account();
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Initialize existing account',
            click: function () {
                show_active_app_screen();
                module.app_command = streemio.DEFS.CMD_APP_INITACCOUNT;
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Restore account',
            click: function () {
                show_active_app_screen();
                module.app_command = streemio.DEFS.CMD_APP_RESTOREACCOUNT;
                streemio.User.restore();
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Backup account',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }

                show_active_app_screen();
                streemio.User.backup();
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Change passphrase',
            click: function () {
                if (!module.is_node_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }

                show_active_app_screen();
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_CHANGE_KEY);                
            }
        }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Delete account',
            click: function () {
                if (!module.is_node_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }
                
                show_active_app_screen();
                bootbox.confirm("Your account will be removed from the Streemio network. Click on OK to continue!", function (result) {
                    if (result) {
                        streemio.PeerNet.delete_public_key(function (err) {
                            if (err) {
                                return streemio.notify.error_popup("Delete account error %j", err);
                            }
                            streemio.DB.del(streemio.DB.ACCOUNTSDB, streemio.User.name).then(
                                function () {
                                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
                                    document.title = "Streemio";
                                    module.is_node_initialized = false;
                                    streemio.User.clear();
                                },
                                function (err) {
                                    streemio.notify.error_popup("Deleting account from local database error %j", err);
                                }
                            );
                        });
                    }
                });

            }            
        }));
        streemioMenu.append(new gui.MenuItem({ type: 'separator' }));
        streemioMenu.append(new gui.MenuItem({
            label: 'Exit',
            click: function () {
                gui.App.quit();
            }
        }));
        
        menubar.append(new gui.MenuItem({ label: 'Streemio', submenu: streemioMenu }));
        
        var toolsMenu = new gui.Menu();        
        toolsMenu.append(new gui.MenuItem({
            label: 'Settings',
            click: function () {
                show_active_app_screen();
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_SETTINGS);
            }
        }));
        toolsMenu.append(new gui.MenuItem({ type: 'separator' }));
        toolsMenu.append(new gui.MenuItem({
            label: 'Account/network info',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    streemio.notify.error_popup("The account is not initialized");
                }
                else {
                    show_active_app_screen();
                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_ACCOUNT_INFO);
                }
            }
        }));
        toolsMenu.append(new gui.MenuItem({
            label: 'View logs',
            click: function () {
                streemio.UI.showLogs();
            }
        }));
        toolsMenu.append(new gui.MenuItem({
            label: 'Clear database',
            click: function () {
                bootbox.confirm("All settings and data will be removed from the local database", function (result) {
                    if (result) {
                        streemio.DB.clear().then(
                            function () {
                            },
                            function (err) {
                                streemio.notify.error_popup("Database clear error %j", err);
                            }
                        );
                    }
                });
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Tools', submenu: toolsMenu }));
        
        var contactMenu = new gui.Menu();       
        contactMenu.append(new gui.MenuItem({
            label: 'Interact with contact',
            click: function () {
                if (!module.is_node_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }
                
                streemio.UI.showContacts();
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_USERSTART);
            }
        }));
        
        contactMenu.append(new gui.MenuItem({ type: 'separator' }));
        
        contactMenu.append(new gui.MenuItem({
            label: 'Get messages',
            click: function () {
                if (!module.is_node_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }
                
                // get the offline messages
                var key = streemio.User.name + "/message";
                streemio.PeerNet.get_account_messages(key);
            }
        }));
        contactMenu.append(new gui.MenuItem({ type: 'separator' }));
        
        contactMenu.append(new gui.MenuItem({
            label: 'Find contact',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }

                streemio.Session.contactsvm.dosearch();
            }
        }));
        contactMenu.append(new gui.MenuItem({
            label: 'Backup contacts to file',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }

            }
        }));
        contactMenu.append(new gui.MenuItem({
            label: 'Restore contacts from file',
            click: function () {
                if (!streemio.User.is_user_initialized) {
                    return streemio.notify.error_popup("The account is not initialized");
                }
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Contacts', submenu: contactMenu }));
        
        var thingsMenu = new gui.Menu();
        thingsMenu.append(new gui.MenuItem({
            label: 'Create IoT device account',
            click: function () {
                streemio.notify.info_panel("IoT device module is not installed. To use the device features first download, install and configure the IoT device module.");
            }
        }));
        thingsMenu.append(new gui.MenuItem({
            label: 'Configure IoT device',
            click: function () {
                streemio.notify.info_panel("IoT device module is not installed. To use the device features first download, install and configure the IoT device module.");
            }
        }));
        thingsMenu.append(new gui.MenuItem({
            label: 'Upgrade IoT device',
            click: function () {
                streemio.notify.info_panel("IoT device module is not installed. To use the device features first download, install and configure the IoT device module.");
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Machines', submenu: thingsMenu }));
        
        var helpMenu = new gui.Menu();
        helpMenu.append(new gui.MenuItem({
            label: 'Help Content',
            click: function () {
                $(".app-select-screen").hide();
                $(".appboot-screen").hide();
                $(".streemio-screen").show();
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_HELP);
            }
        }));
        helpMenu.append(new gui.MenuItem({ type: 'separator' }));
        helpMenu.append(new gui.MenuItem({
            label: 'About Streemio',
            click: function () {
                streemio.UI.show_about();
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Help', submenu: helpMenu }));
        
        win.menu = menubar;
    }
    
    module.start = function (ui_callback) {

        async.waterfall([  
            function (callback) {
                // initialize the database
                console.log("Initializing the database");
                streemio.DB.init().then(
                    function () {
                        logger.debug("database initialized: " + streemio.DB.is_initialized);
                        callback(null);
                    },
                    function (err) {
                        logger.error("streemio.DB.init error %j", err);
                        callback(err);
                    }
                );
            },   
            function (callback) {
                //  get the settings db
                streemio.DB.get(streemio.DB.SETTINGSDB, "settings").then(
                    function (result) {
                        if (result && result.data && result.data.loglevel != null && result.data.transport != null && result.data.tcpport != null && result.data.wsport != null && result.data.bootseeds != null && result.data.pending_contacts != null ) {
                            console.log("settings database is populated");                   
                            streemio.Session.settings = result;
                            streemio.config.data = result.data;
                            callback();
                        }
                        else {
                            //  add records to the database
                            console.log("update settings database with default data");                                                
                            streemio.Session.update_settings(streemio.config.data, callback);
                        }
                    },
                    function (err) {
                        logger.error("streemio.DB.get settings error %j", err);
                        callback(err);
                    }
                );
            },     
            function (callback) {
                // set the log level
                console.log("Creating logger");
                
                var logspath = null;
                if (config.isdevmode == true) {
                    var wdir = process.cwd();
                    logspath = path.join(wdir, 'logs');
                }
                else {
                    var nwPath = process.execPath;
                    var nwDir = path.dirname(nwPath);
                    logspath = path.join(nwDir, 'logs');
                }
                
                var level = streemio.config.loglevel;
                console.log('log level: ' + level);
                console.log('log path: ' + logspath);                
                
                streemio.logger.init(level, logspath, streemio.notify.taskbarmsg, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                // make sure the data directory exists
                logger.debug("Creating data directory");
                streemio.util.dataDir(callback);
            }
        ], 
        function (err, result) {
            if (err) {
                appboot_msg_handler("", true);
                var msg = "Error in initializing the application. "
                if (err.message) {
                    msg += util.format("%s", err.message);
                }
                else if (typeof err == "string") {
                    msg += util.format("%s", err);
                }
                else {
                    msg += util.format("%j", err);
                }
                bootbox.alert(msg);
            }
            
            if (ui_callback && typeof ui_callback == 'function') {
                logger.debug("main start is comepleted at %s", new Date().toUTCString())
                ui_callback();
            }
            //
        });
    }
    
    module.set_upnp_port = function (callback) {
        if (!module.is_gui) {
            //  the browser version doesn't set upnp port
            return callback();
        }
        
        if (config.transport == streemio.DEFS.TRANSPORT_WS) {
            //  Websocket no need a UPNP port
            return callback();
        }

        try {
            appboot_msg_handler("Configure UPNP port");

            var natUpnp = require('./libs/upnp/nat-upnp');
            var client = natUpnp.createClient(logger);
            
            var port = config.tcpport;
            client.portMapping(
                {
                    public: port,
                    private: port,
                    ttl: 0,  //  not renew, keep opened
                    description: "Streemio UPNP " + streemio.User.name
                }, 
                function (err) {
                    if (err) {
                        logger.error("UPNP portMapping error: %j", err);
                    }
                    
                    module.upnp_gateway = client.upnp_gateway;
                    module.upnp_local_address = client.upnp_local_address;
                    
                    // still return even if there si an error as the port forwarding could have been set up manually
                    callback();
                }
            );
        }
        catch (e) {
            logger.error("UPNP portMapping exception: %j", e);
            callback();
        }
    }    
    
    module.network_init = function (seeds, skip_publish, completefn) {
        module.is_app_initialized = false;
        
        $(".streemio-screen").hide();
        $(".appboot-screen").show();
        $(".appboot-screen-content").show();
        
        async.waterfall([        
            function (callback) {
                module.set_upnp_port(callback);
            },
            function (callback) {
                // bootstrap the app with the streemio network
                appboot_msg_handler("Bootstrap the network");
                setTimeout(
                    function () {
                        streemio.bootclient.boot(seeds, callback);
                    },
                    100
                );
            },    
            function (bootseeds, callback) {
                if (!bootseeds || !bootseeds.seeds || !bootseeds.seeds.length) {
                    return callback("Error in populating the seed list. Please make sure the 'bootseeds' configuration is correct and a firewall doesn't block the Streemio software!");
                }
                
                // initialize the Peer Network
                appboot_msg_handler("Connecting to Streemio network");
                streemio.PeerNet.init(bootseeds).then(
                    function () {
                        logger.debug("PeerNet is initialized");
                        module.seeds = bootseeds.seeds;
                        module.p2p_port = config.tcpport;
                        callback(null);
                    },
                    function (err) {
                        logger.error("PeerNet init error %j", err);
                        callback(err);
                    }
                );
            },
            function (callback) {
                // validate the connection
                appboot_msg_handler("Validating Streemio network connection");
                streemio.PeerNet.validate_connection().then(
                    function () {
                        appboot_msg_handler("PeerNet connection is validated");
                        logger.debug("PeerNet connection is validated");
                        callback(null);
                    },
                    function (err) {
                        logger.error("Error in P2P connection %j", err);
                        callback(err);
                    }
                );
            },
            function (callback) {
                if (skip_publish) {
                    callback();
                }
                else {
                    streemio.PeerNet.publish_user(callback);
                }
            },
        ], 
        function (err, result) {          
            if (err) {
                appboot_msg_handler("", true);
                var msg = "Error in initializing the application. "
                if (config.transport == streemio.DEFS.TRANSPORT_TCP) {
                    if (!module.upnp_gateway) {
                        msg += "The system was unable to configure your peer listener port via UPnP. Please check you router configuration to allow UPnP port configuration. If UPnP is disabled on your router then you must manually configure the listener port mapping. "
                    }
                }
                
                if (err.message) {
                    msg += util.format("%s", err.message);
                }
                else if (typeof err == "string") {
                    msg += util.format("%s", err);
                }
                else {
                    msg += util.format("%j", err);
                }
                
                $(".appboot-screen").hide();
                
                if (completefn) {
                    return completefn(msg);
                }
                else {
                    return bootbox.alert(msg);
                }
            }
            
            $(".appboot-screen").hide();
            $(".streemio-screen").show();    
            
            module.is_app_initialized = true;
            
            if (completefn) {
                completefn();
            }

            //
        });
    }
    
    module.join_to_network = function (seeds, skip_publish, completefn) {
        
        if (!skip_publish) {  // undefined will return true as well but nust set to false
            skip_publish = false;
        }
        
        var retry_with_websocket = false;

        module.network_init(seeds, skip_publish, function (err) {            
            if (err) {
                if (!retry_with_websocket && config.transport == streemio.DEFS.TRANSPORT_TCP && config.wsfallback == true) {
                    logger.info("The TCP connection failed. Retry to connect via WebSockets.")
                    //  set the config transport to WS                    
                    config.transport = streemio.DEFS.TRANSPORT_WS;
                    //  the TCP connection failed, ry with websocket fallback
                    retry_with_websocket = true;
                    module.network_init(seeds, skip_publish, function (ret_err) {
                        if (ret_err) {
                            if (retry_with_websocket) {
                                retry_with_websocket = false;
                                // set back the transport
                                config.transport = streemio.DEFS.TRANSPORT_TCP;
                            }
                            
                            $(".appboot-screen").hide();
                            $(".streemio-screen").hide();
                            $(".app-select-screen").show();

                            return bootbox.alert(ret_err);
                        }
                        else {
                            if (completefn) {
                                completefn();
                            }
                        }
                    });
                }
                else {
                    if (retry_with_websocket) {
                        retry_with_websocket = false;
                        // set back the transport
                        config.transport = streemio.DEFS.TRANSPORT_TCP;
                    }
                    
                    $(".appboot-screen").hide();
                    $(".streemio-screen").hide();
                    $(".app-select-screen").show();

                    return bootbox.alert(err);
                }
            }
            else {
                if (completefn) {
                    completefn();
                }
            }
        });        
    }

    module.init = function (app_cmd) {
        
        module.app_command = app_cmd;
        
        if (app_cmd == streemio.DEFS.CMD_APP_JOINPUBLICNET) {
            module.network_type = streemio.DEFS.PUBLIC_NETWORK;
            if (!streemio.User.is_user_initialized) {
                events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
                $(".streemio-screen").show();
            }            
            else {
                logger.debug("Publish user to public network");
                var seeds = config.bootseeds;
                module.join_to_network(seeds);
            }
        }
        else if (app_cmd == streemio.DEFS.CMD_APP_JOINPRIVATENET) {
            module.network_type = streemio.DEFS.PRIVATE_NETWORK;
            events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false });
            $(".streemio-screen").show();
        }
        else if (app_cmd == streemio.DEFS.CMD_APP_CREATEACCOUNT) {
            module.network_type = streemio.DEFS.PUBLIC_NETWORK;
            start_new_account();
        }
        else if (app_cmd == streemio.DEFS.CMD_APP_INITACCOUNT) {
            module.network_type = streemio.DEFS.PUBLIC_NETWORK;
            events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_INIT_USER, null, { newuser: false, initexisting: true });
            $(".streemio-screen").show();
        }
        else if (app_cmd == streemio.DEFS.CMD_APP_RESTOREACCOUNT) {
            streemio.User.restore();
            $(".streemio-screen").show();
        }
    }
    
    events.on(events.APPEVENT, function (eventcmd, payload, info) {
        if (eventcmd == events.TYPES.ONUSERINIT) {
            logger.debug("event ONUSERINIT");
            
            if (!streemio.User.is_user_initialized) {
                return streemio.notify.error_popup("ONUSERINIT event error: invalid user context");
            }
            
            if (module.app_command == streemio.DEFS.CMD_APP_JOINPUBLICNET) {
                logger.debug("Publish user to public network");
                var seeds = config.bootseeds;
                module.join_to_network(seeds);
            }
            else if (module.app_command == streemio.DEFS.CMD_APP_JOINPRIVATENET) {
                var seeds = [module.private_net_seed];
                module.join_to_network(seeds);
            }
        }
        else if (eventcmd == events.TYPES.ONUSERPUBLISH) {
            streemio.notify.taskbarmsg("Peer is connected. The peer info has been published to the network.");
            logger.debug("initialize contacts list");
            
            streemio.Contacts.init();
            streemio.UI.showContacts();
            
            module.is_node_initialized = true;

            events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_USERSTART);
        }
        else if (eventcmd == events.TYPES.ONCALLWEBRTCSIGNAL) {
            streemio.MediaCall.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFILEWEBRTCSIGNAL) {
            streemio.FileTransfer.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFCHUNKSEND) {
            streemio.FileTransfer.onFileChunkReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFILECANCEL) {
            streemio.FileTransfer.cancel_by_peer(payload);
        }
        else if (eventcmd == events.TYPES.ONVIDEOCONNECT) {
            if (streemio.Session.curent_viewmodel && streemio.Session.curent_viewmodel.onRemoteVideoConnect) {
                streemio.Session.curent_viewmodel.onRemoteVideoConnect();
            }
        }
        else if (eventcmd == events.TYPES.ONTEXTMSG) {
            logger.debug("ONTEXTMSG event %j", payload);
            if (streemio.Session.curent_viewmodel && streemio.Session.curent_viewmodel.onTextMessage) {
                streemio.Session.curent_viewmodel.onTextMessage(payload);
            }
            else {
                streemio.Session.contactsvm.onTextMessage(payload);
            }
        }
        else if (eventcmd == events.TYPES.ONPEERMSG) {
            streemio.PeerNet.onPeerMessage(payload, info);
        }
        else if (eventcmd == events.TYPES.ONACCOUNTMSG) {
            streemio.UI.onAccountMsg(payload);
        }
        else if (eventcmd == events.TYPES.ONINITPROGRESS) {
            appboot_msg_handler(payload);
        }
        else if (eventcmd == events.TYPES.ONPEERERROR) {
            if (!module.is_app_initialized || !streemio.User.is_user_initialized) {
                var msg = "Peer communication error";
                if (payload && payload.error) {
                    msg = payload.error;
                }
                logger.info("Error in application initialization: %j", msg);
            }
            else {
                streemio.PeerNet.onPeerError(payload);
            }
        }

    });
    
    return module;

}(streemio.Main || {}, streemio.logger, global.appevents, streemio.config));


/*
    knockout binding handlers
 */

// for HTML5 progress
ko.bindingHandlers.progressctrl = {
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




