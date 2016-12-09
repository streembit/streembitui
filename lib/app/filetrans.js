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

var logger = require("applogger");
var defs = require("definitions");
var appevents = require("appevents");
var filesaver = require("filesaver");
var md5util = require("md5util"); 

(function () {

    var fproc = fproc || {};

    fproc.chunksize = 8192;
    fproc.list_of_sendfiles = {};
    fproc.list_of_rcvfiles = {};

    function cancelFile(file) {
        file.iscancelled = true;

        try {
            delete fproc.list_of_sendfiles[file.hash];
        }
        catch (e) {
        }

        try {
            delete fproc.list_of_rcvfiles[file.hash];
        }
        catch (e) {
        }        
    }

    function getWait(fsize) {
        var wait = 200;
        switch (true) {
            case (fsize <= 100000):
                wait = 50;
                break;
            case (fsize > 100000 && fsize <= 1000000):
                wait = 75;
                break;
            case (fsize > 1000000 && fsize <= 4000000):
                wait = 100;
                break;
            case (fsize > 4000000 && fsize <= 10000000):
                wait = 150;
                break;
            default:
                wait = 200;
        }

        return wait;
    }


    function fileItem(fileobj, filename, filesize, filehash, filetype, filepath, chunksize) {
        if (!chunksize) {
            chunksize = fproc.chunksize;
        }

        var obj = {
            fileobj: fileobj,
            name: filename,
            size: filesize,
            hash: filehash,
            type: filetype,
            path: filepath,
            offset: 0,
            iscancelled: false,
            fqueue: [],
            qtimer: null,
            currpos: 0,
            missingpos: 0,
            iserror: false,
            chunksize: chunksize,
            maxpos: (parseInt((filesize / chunksize)) + ((filesize % chunksize) > 0 ? 1 : 0)) || 1,
            blobitems: []
        };

        obj.initialize = function () {
            // create the fqueue
            for (var i = 0; i < obj.maxpos; i++) {
                obj.fqueue[i] = { done: false, data: 0 };
                obj.blobitems[i] = 0;
            }            
        }

        obj.complete_receive = function () {
            if (obj.offset >= obj.size ) {
                if (streembit.globals.nwmode1) { // TODO the corect is nwmode, nwmode1 is for test
                    //TODO
                }
                else {
                    // check if all elements exist in the fqueue
                    var missingItems = [];
                    obj.fqueue.forEach(function (item, index) {
                        if (!item.done || !obj.blobitems[index]) {
                            missingItems.push(index);
                        }
                    });

                    if (missingItems.length > 0) {
                        return obj.get_missingitems(missingItems);
                    }

                    // verify the file integrity via the hash
                    var buffer = new md5util.ArrayBuffer();
                    obj.blobitems.forEach(function (item) {
                        buffer.append(item);
                    });
                    var rcvhash = buffer.end();
                    if (rcvhash != obj.hash) {
                        var msg = "The received file hash does not match with the original file hash.";
                        return appevents.dispatch("on-task-event", "error", "receive", obj.hash, msg);
                    }

                    // show here the complete template so the user can review the hash
                    appevents.dispatch("on-task-event", "complete", "receive", obj.hash);

                    // save the file
                    filesaver(
                        new Blob(obj.blobitems, { type: obj.type }),
                        obj.name
                    );

                    // close the task
                    appevents.dispatch("on-task-event", "close", "receive", obj.hash);
                }
            }
        }

        obj.get_missingitems = function (items) {
            //TODO
        }

        obj.complete_send = function () {
        }

        obj.write = function (pos, offset, length, chunk, callback) {
            try {
                if (obj.fqueue.length == 0 || !obj.fqueue[pos]) {
                    return callback("the file is not initialized");
                }

                if (obj.iscancelled) {
                    clearTimeout(obj.qtimer);
                    obj.fqueue = [];
                    return callback();
                }

                obj.blobitems[pos] = chunk
                obj.fqueue[pos].done = true;
                obj.fqueue[pos].length = length;
                obj.offset += length;
                obj.currpos = pos;

                callback();

                //
            }
            catch (err) {
                callback('file write error:' + err.message);
            }
        }

        obj.process = function (fobj) {
            obj.fqueue.push(fobj);

            if (!obj.qtimer) {
                logger.debug("qtimer start, maxpos: " + obj.maxpos);
                obj.qtimer = setInterval(obj.fwrite, 10);
            }
        }

        obj.read = function (callback) {
            try {
                var offset = obj.offset;
                var chunkSize = obj.chunksize;

                var reader = new window.FileReader();
                reader.onload = (function (event) {
                    var error = event.target.error;
                    if (error) {
                        return callback(error);
                    }

                    var len = event.target.result.byteLength;
                    if (len) {
                        var arraybuffer = event.target.result;
                        var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(arraybuffer)));
                        var result = {
                            hash: obj.hash,
                            pos: obj.currpos,
                            offset: obj.offset,
                            length: len,
                            chunk: base64String
                        };
                        callback(null, result);

                        obj.offset += len;
                        obj.currpos++;
                    }
                });

                var slice = obj.fileobj.slice(offset, offset + chunkSize);
                reader.readAsArrayBuffer(slice);
            }
            catch (err) {
                callback(err);
            }
        }

        obj.initialize();

        return obj;
    }

    function toArrayBuffer(buffer) {
        var ab = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
    }

    function base64ToArrayBuffer(base64) {
        var binaryString = window.atob(base64);
        var binaryLen = binaryString.length;
        var bytes = new Uint8Array(binaryLen);
        for (var i = 0; i < binaryLen; i++) {
            var ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes;
    }

    fproc.cancel = function (hash) {
        var file = fproc.list_of_sendfiles[hash];
        if (file) {
            cancelFile(file);
        }
    }

    fproc.cancel_by_peer = function (payload) {
        if (!payload || !payload.hash) {
            return logger.error("Invalid file cancel data");
        }

        var hash = payload.hash;
        streembit.Session.tasksvm.cancel_by_peer(hash);

        var file = fproc.list_of_sendfiles[hash];
        if (file) {
            file.iscancelled = true;
            setTimeout(
                function () {
                    cancelFile(file);
                },
                1000
            );
        }
    }

    fproc.onFileChunkReceive = function (data) {
        try {
            if (!data || !data.chunk || !data.hash) {
                return logger.error("onFileChunkReceive invalid data")
            }

            var file = fproc.list_of_rcvfiles[data.hash];
            if (!file) {
                var msg = "couldn't find file recieve task,  " + data.hash;
                return appevents.dispatch("on-task-event", "error", "receive", data.hash, msg);
            }

            if (file.iscancelled) {
                return logger.debug("onFileChunkReceive file.iscancelled");
            }

            var chunk = base64ToArrayBuffer(data.chunk);
            if (data.length != chunk.length) {
                return appevents.dispatch("on-task-event", "error", "receive", data.hash, "invalid file chunk received, data length is incorrect");
            }

            //console.log("received pos: " + data.pos + " offset: " + data.offset + " length: " + data.length);
            file.write(data.pos, data.offset, data.length, chunk, function () {
                //console.log("receive task value: " + file.offset);
                appevents.dispatch("on-task-event", "update", "receive", data.hash, file.offset);

                if (file.offset >= file.size) {
                    try {
                        // complete if it is ended
                        file.complete_receive();
                    }
                    catch (err) {
                        appevents.dispatch("on-task-event", "error", "receive", data.hash, err.message);
                    }
                }
            });           

            //
        }
        catch (err) {
            logger.error("onFileChunkReceive error: " + err.message);
        }
    }

    function sendproc(hash, onread, oncomplete, onerror) {

        logger.debug('filtrans sendproc()');

        if (typeof onerror != "function") {
            throw new Error("invalid onread callback");
        }

        if (typeof onread != "function") {
            return onerror("invalid onread callback");
        }

        if (typeof oncomplete != "function") {
            return onerror("invalid onread callback");
        }

        var file = fproc.list_of_sendfiles[hash];

        if (!file) {
            return onerror("File send error: invalid file");
        }

        var name = file.name;
        if (!name) {
            return onerror("File send error: invalid file name");
        }

        var path = file.path || "";

        var fsize = file.size;
        if (fsize === 0) {
            return onerror('File is empty, please select a non-empty file');
        }

        if (fsize > 100000000) {
            return onerror('The maximum supported file size of this software version is 100 MB');
        }

        if (!file.fileobj) {
            return onerror('Invalid file object at filetrans.');
        }

        console.log('file is ' + [file.name, fsize, file.type].join(' '));

        var wait = getWait(fsize);

        logger.debug('chunk size: ' + file.chunksize + ' send interval: ' + wait);

        file.offset = 0;
        file.qtimer = setInterval(function () {
            try {
                if (file.iscancelled) {
                    clearTimeout(file.qtimer);
                    logger.debug("file transfer was cancelled")
                    return;
                }

                if (file.offset >= fsize) {
                    clearTimeout(file.qtimer);
                    logger.debug("file transfer complete, offset bytes: " + file.offset);
                    return oncomplete(hash);
                }

                // read the next chunk
                file.read(function (err, result) {
                    if (err) {
                        file.iserror = true;
                        clearTimeout(file.qtimer);
                        return onerror(err);
                    }

                    if (!result) {
                        file.iserror = true;
                        clearTimeout(file.qtimer);
                        return onerror("Failed to receive data from file read");
                    }
              
                    onread(result);

                    //
                });
            }
            catch (err) {
                logger.error('file send error %j', err);
            }
        },
        wait);
    }


    //  public methods
    fproc.initsend = function (fileobj, filename, filesize, filehash, filtype, filepath, onread, oncomplete, onerror) {

        fproc.connection = 0;

        if (!filename || !filehash) {
            throw new Error("Invalid file");
        }

        if (filesize === 0) {
            throw new Error('File is empty, please select a non-empty file');
        }

        if (!filtype) {
            //TODO get/guess more properly the MIME type
            filetype = "text/plain";
        }

        var item = new fileItem(fileobj, filename, filesize, filehash, filtype, filepath);
        fproc.list_of_sendfiles[filehash] = item;

        sendproc(filehash, onread, oncomplete, onerror);

        //
    }

    fproc.initreceive = function (options, oncomplete) {
        try {

            if (!options || !options.file || !options.file.size || !options.file.name || !options.file.hash)
                throw new Error("Invalid file");

            var hash = options.file.hash;
            var file = new fileItem(null, options.file.name, options.file.size, hash, options.file.type);
            file.oncomplete = oncomplete || function () { };

            fproc.list_of_rcvfiles[hash] = file;

            logger.debug("FileTransfer from " + options.contact.name + " file size: " +
                options.file.size + " file name: " + options.file.name + " file type: " + options.file.type);

        }
        catch (err) {
            streembit.notify.error("File receive error %j", err);
        }
    }

    module.exports = fproc;

}());

