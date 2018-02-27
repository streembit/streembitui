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
    
    var bootbox = require("makeusabrew/bootbox"); 
    var webrtcfile = require("webrtcfile"); 
    var peercomm = require("peercomm"); 
    var appevents = require("appevents"); 
    var errhandler = require("errhandler");
    var errcodes = require("errcodes");

    function SendFile(param) {

        var viewModel = {

            contact: param,

            dispose: function () {

            },

            oncomplete: function (hash) {
                // complete the task
                appevents.dispatch("on-task-event", "complete", "send", hash);
            },

            onerror: function (hash, err, param) {
                try {
                    appevents.error( 0x8200, err, param);
                    appevents.dispatch("on-task-event", "error", "send", hash, err);
                }
                catch (err) {
                    // streembit.notify.error("Send  file VM onerror: %j", err, true)
                    streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_VM, err, true)); 
                }
            },

            onsend: function (hash, value) {
                console.log("onsend value: " + value);
                appevents.dispatch("on-task-event", "update", "send", hash, value );
            },

            offer: function (params, callback) {
                var filename = params.file.name,
                    filesize = params.file.size,
                    filehash = params.filehash,
                    filetype = params.file.type;

                peercomm.ping(viewModel.contact, true, 10000)
                    .then(
                        function () {
                            return peercomm.get_contact_session(viewModel.contact);
                        },
                        function (err) {
                            throw new Error(err);
                        }
                    )
                    .then(
                        function () {
                            return peercomm.initfile(viewModel.contact, filename, filesize, filehash, filetype, 'file', 20000)
                        },
                        function (err) {
                            throw new Error(err);
                        }
                    )                
                    .then(
                        function (isaccepted) {
                            console.log("File transfer init result: " + isaccepted);
                            if (isaccepted == true) {
                                callback();
                            }
                            else {
                                // streembit.notify.error("The contact refused to accept the file");
                                streembit.notify.error(errhandler.getmsg(errcodes.UI_ACCEPT-FILE)); 
                            }
                        },
                        function (err) {
                            // streembit.notify.error("Error in starting file transfer");
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_FILE_TRANSFER));
                        }
                    );
            },

            initsend: function (params) {
                try {
                    if (!params || !params.file || !params.filehash || !params.file.size) {
                        // return streembit.notify.error("Invalid send file parameters", null, true)
                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_SEND_FILE_PARAMS, null, true));
                    }

                    params.contact = viewModel.contact;

                    viewModel.offer(params, function () {   
                        try {
                            appevents.dispatch("on-task-event", "add", {
                                proc: "info",
                                type: "file",
                                mode: "send",
                                file_name: params.file.name,
                                taskid: params.filehash,
                                file_size: params.file.size,
                                contact: viewModel.contact,
                                showconnect: true
                            });

                            params.onsend = viewModel.onsend;
                            params.oncomplete = viewModel.oncomplete;
                            params.onerror = viewModel.onerror;

                            webrtcfile.sendfile(params);
                            //
                        }
                        catch (e) {
                            appevents.dispatch("on-task-event", "error", "send", params.filehash, e);
                            // streembit.notify.error("Error in sending the file: " + e.message, null, true)
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_IN_SENDING_FILE, +e.message, null, true));
                        }
                    });
                }
                catch (e) {
                    appevents.dispatch("on-task-event", "error", "send", params.filehash, e);
                    // streembit.notify.error("Error in sending the file: " + e.message, null, true);
                    streembit.notify.error(errhandler.getmsg(errcodes.UI_IN_SENDING_FILE, +e.message, null, true));
                }
            },

            readfile: function () {
                try {

                    if (!window.FileReader) {
                        return alert('FileReader API is not supported by your browser.');
                    }

                    var $i = $('#fileInput'), input = $i[0];
                    if (!input.files || !input.files.length) {
                        return alert("File not selected or browser incompatible.");
                    }

                    var file = input.files[0]; // The file  
                    if (file.size === 0) {
                        return alert('File is empty, please select a non-empty file');
                    }

                    var params = {
                        file: 0,
                        filehash: "",
                        is_sender: true
                    };

                    /*
                    TODO
                    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
                        chunkSize = 2097152,                             // Read in chunks of 2MB
                        chunks = Math.ceil(file.size / chunkSize),
                        currentChunk = 0,
                        buffer = TODO see the file sender,
                        fileReader = new FileReader();

                    fileReader.onload = function (e) {
                        console.log('read chunk nr', currentChunk + 1, 'of', chunks);
                        // Append array buffer
                        buffer.append(e.target.result);
                        currentChunk++;

                        if (currentChunk < chunks) {
                            loadNext();
                        }
                        else {
                            console.log('finished loading');
                            // Compute hash
                            var hash = buffer.end();
                            console.info('computed hash', hash);
                            params.filehash = hash;
                            params.file = file;
                            // call the file sender 
                            viewModel.initsend(params);
                        }
                    };

                    fileReader.onerror = function () {
                        alert('Error in reading the file and computing the file hash.');
                    };

                    function loadNext() {
                        var start = currentChunk * chunkSize,
                            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

                        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
                    }

                    loadNext();

                    */
                }
                catch (e) {
                    bootbox.alert("Error in reading the file: " + e.message);
                }
            },

            run: function () {

                var content = $("#send-file-template").html();
                var box = bootbox.dialog({
                    message: content,
                    title: "Send File",
                    closeButton: false,
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: 'btn-light',
                            callback: function () {
                            }
                        },
                        success: {
                            label: "Send",
                            className: 'btn-light',
                            callback: viewModel.readfile
                        }
                    }
                });

                box.init(function () {
                    $(".modal-header").css("padding", "4px 8px 4px 12px");
                });
            }
        };

        return viewModel;
    }

    module.exports = SendFile;

})();
