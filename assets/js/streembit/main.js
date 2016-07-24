/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

var streembit = streembit || {};

var gui = global.appgui;

if (gui && gui.App) {
    console.log("vesion: " + gui.App.manifest.version);
    logger.info("vesion: " + gui.App.manifest.version);
}

if (gui && gui.App && gui.App.dataPath) {
    logger.info("Data path is " + gui.App.dataPath);
}

var util = require('util');
var async = require("async");
// use the global.cryptolib so the browserify version can configure the browser crypto library
var nodecrypto = require(global.cryptolib);
var EccKey = require('streembitlib/crypto/EccKey');
var secrand = require('secure-random');

streembit.Error.init();

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


streembit.util = (function (util) {
    
    function createDataDir(callback) {
        if (!gui) {
            callback();
        }
        else {
            var datapath = null;
            var datadir = 'data';
            
            if (streembit.config.isdevmode == true) {
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
        var html = $("#streembit-view-" + view).html();
        callback(html);
    }
    
    function loadLogs(callback) {
        if (!gui) {
            //return callback("The browser version of Streembit does not support this feature. Try the desktop version for maximum security and to access more features!");
            callback(null, streembit.logger.logs);
        }
        else {
            if (!global.logspath) {
                return callback("The global logs path does not exists");
            }
            var logfile = 'streembit.log';
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
        if (streembit.Main.is_gui) {
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
    
    function getRepoVersion(callback) {
        
        const https = require('https');
        
        var options = {
            host: 'api.github.com',
            path: '/repos/streembit/streembitui/releases',
            method: 'GET',
            headers: { 'user-agent': 'node.js' }
        };
        
        var request = https.request(options, function (response) {
            var body = '';
            response.on("data", function (chunk) {
                body += chunk.toString('utf8');
            });
            
            response.on("end", function () {
                var version = null;
                try {
                    var data = JSON.parse(body);
                    if (Array.isArray(data) && data.length > 0) {
                        if (data[0].tag_name) {
                            version = data[0].tag_name;
                        }
                    }
                }
                catch (e) {
                    version = null;
                }

                callback(version);

            });
        });
        
        request.on('error', function (e) {
            logger.error('getRepoVersion error: %j' + e);
            callback();
        });
        
        request.end();
        
    }
    
    return {
        loadView: loadView,
        loadLogs: loadLogs,
        timeNow: timeNow,
        fileHash: getFileHash,
        dataDir: createDataDir,
        deleteFile: deleteFile,
        getVersion: getRepoVersion
    };

}(streembit.util || {}));


streembit.Fdialog = (function (module) {
    
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

}(streembit.Fdialog || {}));


streembit.UI = (function (module, logger, events, config) {
    
    module.messagesvm = null;
    
    module.streembit_appshow = function () {
        $("#app-init-screen").empty();
        $("#app-init-screen").hide();
        $(".streembit-screen").show();
    }

    module.show_startscreen = function () {
        $(".streembit-screen").hide();
        $("#app-init-screen").empty();
        var html = $("#appstart").html();
        $("#app-init-screen").append(html);
        $("#app-init-screen").show();
    };
    
    module.hide_netbootscreen = function () {
        $("#app-init-screen").empty();
        $("#app-init-screen").hide();
    };
    
    module.show_netbootscreen = function () {
        $(".streembit-screen").hide();
        $("#app-init-screen").empty();
        var html = $("#netboot").html();
        $("#app-init-screen").append(html);
        $("#app-init-screen").show();
    };

    module.showContacts = function () {
        $("#app-init-screen").empty();
        $("#app-init-screen").hide();
        $(".streembit-screen").show();
        $('.contacts-tab').show();
        $("#main-container").css('left', 281);
    };
    
    module.hideContacts = function () {
        $('.contacts-tab').hide();
        $("#main-container").css('left', 0);
    };
    
    module.set_account_title = function (account) {
        document.title = "Streembit - " + account;
        if (!streembit.Main.is_gui) {
            $(".menu-account-info").text(account);
            $(".nav-account-info").show();
        }
    };
    
    module.accept_call = function (sender, type, resultfn) {
        
        if (type != streembit.DEFS.CALLTYPE_VIDEO && type != streembit.DEFS.CALLTYPE_AUDIO) {
            return streembit.notify.error("Invalid call type received from " + sender);
        }
        
        var ctype;
        if (type == streembit.DEFS.CALLTYPE_VIDEO) {
            ctype = "video";
        }
        else {
            ctype = "audio";
        }
        var msg = "Incoming " + ctype + " call from " + sender + ". Accept call?";
        
        streembit.UI.streembit_appshow();

        var audioctrl = document.getElementById('ringsound1');
        audioctrl.muted = false;
        audioctrl.play();

        try {
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
        }
        catch (err) {
            audioctrl.pause();
            audioctrl.muted = true;
            resultfn(false);
        }
        
    };
    
    module.accept_sharescreen = function (sender, resultfn) {
  
        var msg = "Contact " +  sender + " is offering screen sharing. Would you like to view the screen of contact " + sender +  "? (Your screen won't be shared)";
        
        streembit.UI.streembit_appshow();

        var audioctrl = document.getElementById('ringsound1');
        audioctrl.muted = false;
        audioctrl.play();
        
        try {
            streembit.UI.streembit_appshow();
            
            bootbox.dialog({
                message: msg,
                title: "Screen share offer",
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
        }
        catch (err) {
            audioctrl.pause();
            audioctrl.muted = true;
            resultfn(false);
        }
        
    }

    module.accept_file = function (sender, file_name, file_size, callback) {
        var text = "Incoming file transfer from " + sender + ". File name: " + file_name + ".  File size: " + file_size + " bytes. Accept file?";
        bootbox.confirm(text, function (result) {
            callback(result);
        });
    }
    
    module.onAccountMsg = function (result) {

        if (!module.messagesvm) {
            module.messagesvm = new streembit.vms.MessagesViewModel();
        }
        
        if (!result)
            return;
        
        if (result.error) {
            return streembit.notify.error("Get offline messages error:  %j", e);
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
            
            if (keyarr[0] != streembit.User.name || keyarr[1] != "message")
                break;
            
            var hash = keyarr[keyarr.length - 1];
            var value = messages[i].value;
            module.messagesvm.add_message(key, value);
        }
        
        if (module.messagesvm.messages().length > 0) {
            // navigate the to the messages view
            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_ACCOUNT_MESSAGES);
        }
        else {
            logger.info("There are no messages on the network for " + streembit.User.name);
        }
    }
    
    module.NavigateInitUser = function () {
        events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER);
    }
    
    module.showLogs = function () {
        try {
            var content = $("#app-logs-template").html();
            streembit.util.loadLogs(function (err, result) {
                try {
                    if (err) {
                        return streembit.notify.error_popup(err);
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
                    var vm = new streembit.vms.LogsViewModel();
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
            //var vm = new streembit.vms.LogsViewModel();
            
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
                        vm = new streembit.vms.SendFileViewModel(contact, onInitStart, onInitEnd);
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
            
            var contact = streembit.Contacts.get_contact(sender);
            var file = { size: file_params.file_size, name: file_params.file_name, type: file_params.file_type, hash: file_params.file_hash };
            var options = {
                contact: contact,
                file: file,
                is_sender: false
            };
            
            streembit.FileTransfer.init_receive(options);
            
            streembit.Session.tasksvm.add({
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
        var content = $("#streembit-view-about").html();
        var box = bootbox.dialog({
            title: "About Streembit", 
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
    
    module.get_device_name = function (callback) {
        var box = bootbox.dialog({
            title: "Enter device name", 
            message: '<div class="row"><div class="col-md-12"><input id="txt_device_name" name="txt_device_name" type="text" class="form-control input-md"></div></div>',
            buttons: {
                success: {
                    label: "Connect",
                    className: 'btn-default',
                    callback: function () {
                        try {
                            var result = $('#txt_device_name').val();
                            if (!result) {
                                return bootbox.alert("he device name was not entered");
                            }                           
                            
                            callback(result);
                        }
                        catch (e) {
                            bootbox.alert("Error in connecting device: " + e.message);
                        }
                    }
                }
            }
        });
    }
    
    return module;

}(streembit.UI || {}, streembit.logger, global.appevents));


streembit.notify = (function (module) {
    
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
    
    module.log_info = function (msg, param, title, time) {
        var text = get_msg(msg, param);
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

}(streembit.notify || {}));


streembit.Session = (function (module, logger, events, config) {
    
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

        streembit.DB.update(streembit.DB.SETTINGSDB, newsettings).then(
            function () {
                logger.debug("added database settings");
                module.settings = newsettings;
                // assign the new settings to the global config
                streembit.config.set_config(module.settings.data);
                callback(null);
            },
            function (err) {
                logger.error("add database settings error %j", err);
                callback(err);
            }
        );
    }
    
    module.get_settings = function (callback) {
        streembit.DB.get(streembit.DB.SETTINGSDB, "settings").then(
            function (result) {
                logger.debug("database result populated");
                if (result && result.data) {
                    module.settings = result.data;
                }
                callback();           
            },
            function (err) {
                logger.error("streembit.DB.get settings error %j", err);
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

            streembit.DB.update(streembit.DB.SETTINGSDB, module.settings).then(
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

        streembit.DB.update(streembit.DB.SETTINGSDB, module.settings).then(
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
        
        streembit.DB.update(streembit.DB.SETTINGSDB, module.settings).then(
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

}(streembit.Session || {}, streembit.logger, global.appevents, streembit.config));


streembit.Main = (function (module, logger, events, config) {
    
    module.version = global.appgui ? global.appgui.App.manifest.version : ".web";
    module.is_gui = global.appgui != null;
    module.is_app_initialized = false;
    module.is_node_initialized = false;
    module.network_type = streembit.DEFS.PUBLIC_NETWORK;
    module.private_net_seed = 0;
    module.app_command = 0;
    module.upnp_gateway = "";
    module.upnp_local_address = "";
    module.seeds = [];    

    function display_new_account() {
        streembit.UI.streembit_appshow();
        module.app_command = streembit.DEFS.CMD_APP_CREATEACCOUNT;
        events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: true });
    }

    function start_new_account() {
        if (streembit.Node.is_node_connected() == true) {
            display_new_account();
        }
        else {
            streembit.User.create_anonym_account();
            var params = {
                seeds: config.bootseeds,
                public_key: streembit.User.public_key,
                account: streembit.User.name     
            };
            module.join_to_network(params, true, function () {
                display_new_account();
            });
        }
    }
    
    function onSeedConnect(node) {
        logger.debug("peer seed is connected %j", node);
    }

    module.initMenu = function () {
        
        if (!module.is_gui) {
            streembit.Menu.initMenu();
            return;
        }
        
        var win = gui.Window.get();
        var menubar = new gui.Menu({ type: 'menubar' });
        var streembitMenu = new gui.Menu();
        
        streembitMenu.append(new gui.MenuItem({
            label: 'Start Streembit',
            click: function () {
                streembit.UI.show_startscreen();
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Connect to public network',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    streembit.UI.streembit_appshow();
                    module.network_type = streembit.DEFS.PUBLIC_NETWORK;
                    module.app_command = streembit.DEFS.CMD_APP_JOINPUBLICNET;
                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
                }            
                else {
                    logger.debug("Publish user to public network");
                    var params = {
                        seeds: config.bootseeds,
                        public_key: streembit.User.public_key,
                        account: streembit.User.name     
                    };
                    module.join_to_network(params);
                }
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Connect to private hub',
            click: function () {
                streembit.UI.streembit_appshow();
                module.network_type = streembit.DEFS.PRIVATE_NETWORK;
                module.app_command = streembit.DEFS.CMD_APP_JOINPRIVATENET;
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
            }
        }));
        streembitMenu.append(new gui.MenuItem({ type: 'separator' }));
        streembitMenu.append(new gui.MenuItem({
            label: 'New account',
            click: function () {
                start_new_account();
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Initialize existing account',
            click: function () {
                streembit.UI.streembit_appshow();
                module.app_command = streembit.DEFS.CMD_APP_INITACCOUNT;
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Restore account',
            click: function () {
                streembit.UI.streembit_appshow();
                module.app_command = streembit.DEFS.CMD_APP_RESTOREACCOUNT;
                streembit.User.restore();
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Backup account',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }

                streembit.UI.streembit_appshow();

                streembit.User.backup();
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Change passphrase',
            click: function () {
                if (!module.is_node_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }

                streembit.UI.streembit_appshow();

                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_CHANGE_KEY);                
            }
        }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Delete account',
            click: function () {
                if (!module.is_node_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }
                
                streembit.UI.streembit_appshow();

                bootbox.confirm("Your account will be removed from the Streembit network. Click on OK to continue!", function (result) {
                    if (result) {
                        streembit.PeerNet.delete_public_key(function (err) {
                            if (err) {
                                return streembit.notify.error_popup("Delete account error %j", err);
                            }
                            streembit.DB.del(streembit.DB.ACCOUNTSDB, streembit.User.name).then(
                                function () {
                                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
                                    document.title = "Streembit";
                                    module.is_node_initialized = false;
                                    streembit.User.clear();
                                },
                                function (err) {
                                    streembit.notify.error_popup("Deleting account from local database error %j", err);
                                }
                            );
                        });
                    }
                });

            }            
        }));
        streembitMenu.append(new gui.MenuItem({ type: 'separator' }));
        streembitMenu.append(new gui.MenuItem({
            label: 'Exit',
            click: function () {
                gui.App.quit();
            }
        }));
        
        menubar.append(new gui.MenuItem({ label: 'Streembit', submenu: streembitMenu }));
        
        var toolsMenu = new gui.Menu();        
        toolsMenu.append(new gui.MenuItem({
            label: 'Settings',
            click: function () {
                streembit.UI.streembit_appshow();
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_SETTINGS);
            }
        }));
        toolsMenu.append(new gui.MenuItem({ type: 'separator' }));
        toolsMenu.append(new gui.MenuItem({
            label: 'Ping to network',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    streembit.notify.error_popup("The account is not initialized");
                }
                else {
                    // ping
                    try {
                        streembit.Node.validate_contacts(function (err, contcount) {
                            if (err) {
                                streembit.notify.error_popup("The peer is not connected. Error: " + err);
                            }
                            else if (!contcount) {
                                streembit.notify.error_popup("The peer is not communicating with any contacts.");
                            }
                            else {
                                streembit.notify.info("Number of connected peers: " + contcount);
                            }
                        });
                    }
                    catch (err) {
                        streembit.notify.error_popup("The peer is not connected. Error: %s", err.message);
                    }
                }
            }
        }));
        toolsMenu.append(new gui.MenuItem({ type: 'separator' }));
        toolsMenu.append(new gui.MenuItem({
            label: 'Account/network info',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    streembit.notify.error_popup("The account is not initialized");
                }
                else {
                    streembit.UI.streembit_appshow();
                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_ACCOUNT_INFO);
                }
            }
        }));
        toolsMenu.append(new gui.MenuItem({
            label: 'View logs',
            click: function () {
                streembit.UI.showLogs();
            }
        }));
        toolsMenu.append(new gui.MenuItem({
            label: 'Clear database',
            click: function () {
                bootbox.confirm("All settings and data will be removed from the local database", function (result) {
                    if (result) {
                        streembit.DB.clear().then(
                            function () {
                            },
                            function (err) {
                                streembit.notify.error_popup("Database clear error %j", err);
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
                    return streembit.notify.error_popup("The account is not initialized");
                }
                
                streembit.UI.showContacts();
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_USERSTART);
            }
        }));
        
        contactMenu.append(new gui.MenuItem({ type: 'separator' }));
        
        contactMenu.append(new gui.MenuItem({
            label: 'Get messages',
            click: function () {
                if (!module.is_node_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }
                
                // get the offline messages
                var key = streembit.User.name + "/message";
                streembit.PeerNet.get_account_messages(key);
            }
        }));
        contactMenu.append(new gui.MenuItem({ type: 'separator' }));
        
        contactMenu.append(new gui.MenuItem({
            label: 'Find contact',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }

                streembit.Session.contactsvm.dosearch();
            }
        }));
        contactMenu.append(new gui.MenuItem({
            label: 'Backup contacts to file',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }

            }
        }));
        contactMenu.append(new gui.MenuItem({
            label: 'Restore contacts from file',
            click: function () {
                if (!streembit.User.is_user_initialized) {
                    return streembit.notify.error_popup("The account is not initialized");
                }
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Contacts', submenu: contactMenu }));
        
        var thingsMenu = new gui.Menu();
        thingsMenu.append(new gui.MenuItem({
            label: 'Connect to Internet of Things device',
            click: function () {
                if (!module.is_node_initialized) {
                    return streembit.notify.error_popup("Not connected to the Streembit network");
                }
                
                streembit.UI.get_device_name(function (device_name) {
                    if (!device_name) {
                        return;   
                    }
                    
                    streembit.Device.connect(device_name, function (contact) {
                                                    
                    }); 
                });                
            }
        }));
        menubar.append(new gui.MenuItem({ label: 'Machines', submenu: thingsMenu }));
        
        var helpMenu = new gui.Menu();
        helpMenu.append(new gui.MenuItem({
            label: 'Help Content',
            click: function () {
                streembit.UI.streembit_appshow();
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_HELP);
            }
        }));
        helpMenu.append(new gui.MenuItem({ type: 'separator' }));
        helpMenu.append(new gui.MenuItem({
            label: 'Check software updates',
            click: function () {
                streembit.util.getVersion(function (version) {
                    if (version) {
                        try {
                            var tverarr = streembit.Main.version.split(".");
                            var strver = tverarr.join('');
                            var numver = parseInt(strver);
                            var trcvver = version.split('.');
                            var rcvnum = trcvver.join('');
                            var rcvver = parseInt(rcvnum);
                            if (numver >= rcvver) {
                                streembit.notify.success("Your Streembit version v" + streembit.Main.version + " is up to date, there is no new version available.");
                            }
                            else {
                                streembit.notify.success("There is a new Streembit version v" + version + " available for download. Your Streembit current version is v" + streembit.Main.version);
                            }
                        }
                        catch (e) {
                            streembit.notify.error_popup("Error in populating version: %j", e);
                        }
                    }
                });
            }
        }));
        helpMenu.append(new gui.MenuItem({ type: 'separator' }));
        helpMenu.append(new gui.MenuItem({
            label: 'About Streembit',
            click: function () {
                streembit.UI.show_about();
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
                streembit.DB.init().then(
                    function () {
                        logger.debug("database initialized: " + streembit.DB.is_initialized);
                        callback(null);
                    },
                    function (err) {
                        logger.error("streembit.DB.init error %j", err);
                        callback(err);
                    }
                );
            },   
            function (callback) {
                //  get the settings db
                streembit.DB.get(streembit.DB.SETTINGSDB, "settings").then(
                    function (result) {
                        if (result && result.data && result.data.loglevel != null && result.data.transport != null && result.data.tcpport != null && result.data.wsport != null && result.data.bootseeds != null && result.data.pending_contacts != null ) {
                            console.log("settings database is populated");                   
                            streembit.Session.settings = result;
                            streembit.config.data = result.data;
                            callback();
                        }
                        else {
                            //  add records to the database
                            console.log("update settings database with default data");                                                
                            streembit.Session.update_settings(streembit.config.data, callback);
                        }
                    },
                    function (err) {
                        logger.error("streembit.DB.get settings error %j", err);
                        callback(err);
                    }
                );
            },     
            function (callback) {
                try {
                    var fsconfig = require("./config.json");
                    if (fsconfig) {
                        console.log("fsconfig exists");
                        if (fsconfig.tcpaddress) {
                            streembit.config.tcpaddress = fsconfig.tcpaddress;
                            console.log("streembit.config.tcpaddress: " + streembit.config.tcpaddress);
                        }
                        if (fsconfig.bootseeds) {
                            streembit.config.bootseeds = fsconfig.bootseeds;
                            console.log("streembit.config.bootseeds: " + streembit.config.bootseeds);
                        }
                        if (fsconfig.ice_resolvers) {
                            streembit.config.ice_resolvers = fsconfig.ice_resolvers;
                            console.log("streembit.config.ice_resolvers: " + streembit.config.ice_resolvers);
                        }
                    }
                }
                catch (err) {
                    console.log("fsconfig error: " + err.message);
                }

                callback();
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
                
                var level = streembit.config.loglevel;
                console.log('log level: ' + level);
                console.log('log path: ' + logspath);                
                
                streembit.logger.init(level, logspath, streembit.notify.taskbarmsg, function (err) {
                    callback(err);
                });
            },
            function (callback) {
                // make sure the data directory exists
                logger.debug("Creating data directory");
                streembit.util.dataDir(callback);
            }//,
            //function (callback) {
            //    // make sure the data directory exists
            //    logger.debug("Getting software version");
            //    streembit.util.getVersion(callback);
            //}
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
                logger.debug("main start is completed at %s", new Date().toUTCString())
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
        
        if (config.transport == streembit.DEFS.TRANSPORT_WS) {
            //  Websocket no need a UPNP port
            return callback();
        }

        try {
            appboot_msg_handler("Configure UPNP port");

            var natUpnp = require('streembitlib/upnp/nat-upnp');
            var client = natUpnp.createClient(logger);
            
            var port = config.tcpport;
            client.portMapping(
                {
                    public: port,
                    private: port,
                    ttl: 0,  //  not renew, keep opened
                    description: "Streembit UPNP " + streembit.User.name
                }, 
                function (err) {
                    if (err) {
                        logger.error("UPNP portMapping error: %j", err);
                        appboot_msg_handler("UPNP port mapping didn't work.");
                    }
                    else {
                        appboot_msg_handler("UPNP port mapping success.");
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
    
    module.network_init = function (params, skip_publish, completefn) {
        
        var transport = config.transport;
               
        if (!params) {
            return completefn("Invalid parameters at network init for transport " + transport);
        }
        if (!params.seeds || !params.seeds.length) {
            return completefn("Invalid seeds parameter at network init for transport " + transport);
        }
        if (!params.public_key) {
            return completefn("Invalid public key parameter at network init for transport " + transport);
        }
        if (!params.account) {
            return completefn("Invalid public key parameter at network init for transport " + transport);
        }

        module.is_app_initialized = false;
        
        streembit.UI.show_netbootscreen();
        
        var transport = config.transport;
        
        var node_config = { seeds: null, address: null, public_key: params.public_key, account: params.account };
        
        async.waterfall([        
            function (callback) {
                if (transport == streembit.DEFS.TRANSPORT_TCP) {
                    module.set_upnp_port(callback);
                }
                else {
                    callback();
                }
            },    
            function (callback) {
                if (transport == streembit.DEFS.TRANSPORT_TCP) {
                    if (config.tcpaddress) {
                        callback(null, config.tcpaddress);
                    }
                    else {
                        appboot_msg_handler("Discovering own public IP address");
                        streembit.bootclient.discovery(null, params.seeds, callback);
                    }
                }
                else {
                    callback(null, "");
                }
            },
            function (address, callback) {
                appboot_msg_handler("Resolving seeds DNS");
                if (!address && transport == streembit.DEFS.TRANSPORT_TCP) {
                    callback("error in populating discovery address");
                }
                else {
                    if (transport == streembit.DEFS.TRANSPORT_TCP) {
                        logger.info("node address: " + address)
                    }
                    node_config.address = address;
                    streembit.bootclient.resolveseeds(params.seeds, callback);
                }
            },
            function (bootseeds, callback) {
                if (!bootseeds || !bootseeds.length) {
                    return callback("Error in populating the seed list. Please make sure the 'bootseeds' configuration is correct and a firewall doesn't block the Streembit software!");
                }
                
                if (config.transport == streembit.DEFS.TRANSPORT_TCP) {
                    node_config.port = config.tcpport;
                }
                
                node_config.seeds = bootseeds;
                
                // initialize the Peer Network
                appboot_msg_handler("Connecting to Streembit network");
                streembit.PeerNet.init(node_config).then(
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
                streembit.Node.validate_contacts(function (err, contcount) {
                    if (err) {
                        callback("The peer is not connected. Error: " + err);
                    }
                    else if (!contcount) {
                        callback("The peer is not communicating with any contacts.");
                    }
                    else {
                        logger.debug("Number of connected peers: " + contcount);
                        callback();
                    }
                });
            },
            function (callback) {
                if (skip_publish) {
                    callback();
                }
                else {
                    appboot_msg_handler("Publishing user info to the network");
                    streembit.PeerNet.publish_user(callback);
                }
            }
        ], 
        function (err, result) {          
            if (err) {
                appboot_msg_handler("", true);
                var msg = "Error in initializing the application. ";
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
            
            streembit.UI.streembit_appshow();
            
            module.is_app_initialized = true;
            
            if (completefn) {
                completefn();
            }

            //
        });
    }
    
    module.join_to_network = function (params, skip_publish, completefn) {        
        if (!params || !params.seeds || !params.seeds.length) {
            return streembit.notify.error_popup("Invalid parameters at join to network.")
        }

        events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
        
        if (!skip_publish) {  // undefined will return true as well but must set to false
            skip_publish = false;
        }
        
        var retry_with_websocket = false;
        
        var bootseeds = [];
        for (var i = 0; i < params.seeds.length; i++) {
            bootseeds.push(params.seeds[i]);
        }
        params.seeds = bootseeds;

        module.network_init(params, skip_publish, function (err) {            
            if (err) {
                if (!retry_with_websocket && config.transport == streembit.DEFS.TRANSPORT_TCP && config.wsfallback == true) {
                    logger.info("The TCP connection failed. Retry to connect via WebSockets.")
                    //  set the config transport to WS                    
                    config.transport = streembit.DEFS.TRANSPORT_WS;
                    //  the TCP connection failed, ry with websocket fallback
                    retry_with_websocket = true;
                    module.network_init(params, skip_publish, function (ret_err) {
                        if (ret_err) {
                            if (retry_with_websocket) {
                                retry_with_websocket = false;
                                // set back the transport
                                config.transport = streembit.DEFS.TRANSPORT_TCP;
                            }
                            
                            streembit.UI.show_startscreen();

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
                        config.transport = streembit.DEFS.TRANSPORT_TCP;
                    }
                    
                    streembit.UI.show_startscreen();

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
        
        if (app_cmd == streembit.DEFS.CMD_APP_JOINPUBLICNET) {
            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
            module.network_type = streembit.DEFS.PUBLIC_NETWORK;
            if (!streembit.User.is_user_initialized) {
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
                streembit.UI.streembit_appshow();
            }            
            else {
                logger.debug("Publish user to public network");
                var params = {
                    seeds: config.bootseeds,
                    public_key: streembit.User.public_key,
                    account: streembit.User.name     
                };
                module.join_to_network(params);
            }
        }
        else if (app_cmd == streembit.DEFS.CMD_APP_JOINPRIVATENET) {
            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
            module.network_type = streembit.DEFS.PRIVATE_NETWORK;
            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false });
            streembit.UI.streembit_appshow();
        }
        else if (app_cmd == streembit.DEFS.CMD_APP_CREATEACCOUNT) {
            module.network_type = streembit.DEFS.PUBLIC_NETWORK;
            start_new_account();
        }
        else if (app_cmd == streembit.DEFS.CMD_APP_INITACCOUNT) {
            module.network_type = streembit.DEFS.PUBLIC_NETWORK;
            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_INIT_USER, null, { newuser: false, initexisting: true });
            streembit.UI.hideContacts();
            streembit.UI.streembit_appshow();
        }
        else if (app_cmd == streembit.DEFS.CMD_APP_RESTOREACCOUNT) {
            streembit.User.restore();
            streembit.UI.streembit_appshow();
        }
    }
    
    events.on(events.APPEVENT, function (eventcmd, payload, info) {
        if (eventcmd == events.TYPES.ONUSERINIT) {
            logger.debug("event ONUSERINIT");
            
            if (!streembit.User.is_user_initialized) {
                return streembit.notify.error_popup("ONUSERINIT event error: invalid user context");
            }
            
            if (module.app_command == streembit.DEFS.CMD_APP_JOINPUBLICNET) {
                logger.debug("Publish user to public network");
                var params = {
                    seeds: config.bootseeds,
                    public_key: streembit.User.public_key,
                    account: streembit.User.name     
                };
                module.join_to_network(params);
            }
            else if (module.app_command == streembit.DEFS.CMD_APP_JOINPRIVATENET) {
                var seeds = [module.private_net_seed];
                var params = {
                    seeds: seeds,
                    public_key: streembit.User.public_key,
                    account: streembit.User.name  
                };
                module.join_to_network(seeds);
            }
        }
        else if (eventcmd == events.TYPES.ONUSERPUBLISH) {
            streembit.notify.taskbarmsg("Peer is connected. The peer info has been published to the network.");
            logger.debug("initialize contacts list");
            
            streembit.Contacts.init();
            streembit.UI.showContacts();
            
            module.is_node_initialized = true;

            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_USERSTART);
        }
        else if (eventcmd == events.TYPES.ONCALLWEBRTCSIGNAL) {
            streembit.MediaCall.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONCALLWEBRTC_SSCSIG) {
            streembit.ShareScreenCall.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONCALLWEBRTC_SSAUDIOSIG) {
            streembit.AutoAudioCall.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFILEWEBRTCSIGNAL) {
            streembit.FileTransfer.onSignalReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFCHUNKSEND) {
            streembit.FileTransfer.onFileChunkReceive(payload);
        }
        else if (eventcmd == events.TYPES.ONFILECANCEL) {
            streembit.FileTransfer.cancel_by_peer(payload);
        }
        else if (eventcmd == events.TYPES.ONVIDEOCONNECT) {
            if (streembit.Session.curent_viewmodel && streembit.Session.curent_viewmodel.onRemoteVideoConnect) {
                streembit.Session.curent_viewmodel.onRemoteVideoConnect();
            }
        }
        else if (eventcmd == events.TYPES.ONTEXTMSG) {
            logger.debug("ONTEXTMSG event %j", payload);
            if (streembit.Session.curent_viewmodel && streembit.Session.curent_viewmodel.onTextMessage) {
                streembit.Session.curent_viewmodel.onTextMessage(payload);
            }
            else {
                streembit.Session.contactsvm.onTextMessage(payload);
            }
        }
        else if (eventcmd == events.TYPES.ONPEERMSG) {
            streembit.PeerNet.onPeerMessage(payload, info);
        }
        else if (eventcmd == events.TYPES.ONACCOUNTMSG) {
            streembit.UI.onAccountMsg(payload);
        }
        else if (eventcmd == events.TYPES.ONINITPROGRESS) {
            appboot_msg_handler(payload);
        }
        else if (eventcmd == events.TYPES.ONPEERERROR) {
            if (!module.is_app_initialized || !streembit.User.is_user_initialized) {
                var msg = "Peer communication error";
                if (payload && payload.error) {
                    msg = payload.error;
                }
                logger.info("Error in application initialization: %j", msg);
            }
            else {
                streembit.PeerNet.onPeerError(payload);
            }
        }
        else if (eventcmd == "peermsg_devdesc") {
            if (streembit.Device.connection_pending()) {
                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_CONNECT_DEVICE, payload);
            }
        }
        else if (eventcmd == "peermsg_devread_prop_reply") {
            if (streembit.Session.curent_viewmodel && streembit.Session.curent_viewmodel.onpropertyread) {
                streembit.Session.curent_viewmodel.onpropertyread(payload);
            }
        }
        else if (eventcmd == "peermsg_devsubsc_reply") {
            if (streembit.Session.curent_viewmodel && streembit.Session.curent_viewmodel.oneventsubscribe_reply) {
                streembit.Session.curent_viewmodel.oneventsubscribe_reply(payload);
            }
        }
        else if (eventcmd == "peermsg_dev_event") {
            if (streembit.Session.curent_viewmodel && streembit.Session.curent_viewmodel.ondevice_event) {
                streembit.Session.curent_viewmodel.ondevice_event(payload);
            }
        }
        else if (eventcmd == "contact_seen") {
            streembit.Contacts.on_contactseen(payload);
        }

    });
    
    return module;

}(streembit.Main || {}, streembit.logger, global.appevents, streembit.config));


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




