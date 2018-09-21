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

'use strict';

const logger = require("applogger");
const defs = require("definitions");
const appevents = require("appevents");
const filesaver = require("filesaver");
const utilities = require('utilities');
const Buffer = require('buffer').Buffer;
const util = require('util');
const errhandler = require("errhandler");
const errcodes = require("errcodes");
const createHash = require('create-hash');

(function () {

    var fproc = fproc || {};

    fproc.chunksize = defs.FILE_TRANS_CHUNK_SIZE;
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

    function fileItem(fileobj, filename, filesize, filehash, filetype, filepath, chunksize, actiontype, contact) {
        chunksize = chunksize || fproc.chunksize;
        actiontype = actiontype || 'file';

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
            actiontype: actiontype,
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

                    var buffer = Buffer.from(obj.blobitems);

                    const rcvhash = createHash("sha1").update(buffer).digest("hex");

                    //crypto.subtle.digest("SHA-1", buffer).then((result) => {
                        //var rcvhash = utilities.arrayBufferToHex(result);
                        if (rcvhash != obj.hash) {
                            var msg = "The received file hash does not match with the sent file hash.";
                            return appevents.dispatch("on-task-event", "error", "receive", obj.hash, msg);
                        }

                        // complete
                        // show here the complete template so the user can review the hash
                        appevents.dispatch("on-task-event", "complete", "receive", obj.hash);

                        // save the file
                        if (obj.actiontype === 'file') {
                            filesaver(new Blob(obj.blobitems, { type: obj.type }), obj.name);
                        }
                        
                        // close the task
                        appevents.dispatch("on-task-event", "close", "receive", obj.hash);

                    //});
                  
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
                    // return callback("the file is not initialized");
                    return callback(errhandler.getmsg(errcodes.UI_FILE_ISNT_INITIALIZED));
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
                // callback('file write error:' + err.message);
                callback(errhandler.getmsg(errcodes.UI_FILE_WRITE_ERR) + err.message);
            }
        }

        obj.process = function (fobj) {
            obj.fqueue.push(fobj);

            if (!obj.qtimer) {
                logger.debug("qtimer start, maxpos: " + obj.maxpos);
                obj.qtimer = setInterval(obj.fwrite, 10);
            }
        }

        obj.read = function () {
            return new Promise((resolve, reject) => {
                try {
                    obj.sendControl = obj.offset;
                    var nextEnd = obj.sendControl + obj.chunksize;
                    if (nextEnd > obj.size) {
                        nextEnd = obj.size;
                    }
                    var reader = new window.FileReader();
                    reader.onload = (function (event) {
                        var error = event.target.error;
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
                            obj.offset += len;
                            obj.currpos++;
                            resolve(result);
                        }
                    });

                    if (obj.sendControl < obj.size) {
                        var slice = obj.fileobj.slice(obj.sendControl, nextEnd);
                        reader.readAsArrayBuffer(slice);
                    } else {
                        throw new Error(String(errcodes.UI_IN_SENDING_FILE));
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        };

        obj.initialize();

        return obj;
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
            // throw new Error("invalid onread callback");
            throw new Error(errhandler.getmsg(errcodes.UI_INVALID_ONREAD_CALLBACK));
        }

        if (typeof onread != "function") {
            // return onerror("invalid onread callback");
            return onerror(errhandler.getmsg(errcodes.UI_INVALID_ONREAD_CALLBACK));
        }

        if (typeof oncomplete != "function") {
            // return onerror("invalid onread callback");
            return onerror(errhandler.getmsg(errcodes.UI_INVALID_ONREAD_CALLBACK));
        }

        var file = fproc.list_of_sendfiles[hash];

        if (!file) {
            // return onerror("File send error: invalid file");
            return onerror(errhandler.getmsg(errcodes.UI_FILE_SEND_ERR_INVALID_FILE));
        }

        var name = file.name;
        if (!name) {
            // return onerror("File send error: invalid file name");
            return onerror(errhandler.getmsg(errcodes.UI_FILE_SEND_ERR_INVALID_FILE_NAME));
        }

        var path = file.path || "";

        var fsize = file.size;
        if (fsize === 0) {
            // return onerror('File is empty, please select a non-empty file');
            return onerror(errhandler.getmsg(errcodes.UI_FILE_IS_EMPTY_SELECT_FILE));
        }

        if (fsize > defs.MAX_FILE_SIZE) {
            // return onerror('The maximum supported file size of this software version is 25 MB');
            return onerror(errhandler.getmsg(errcodes.UI_MAX_SUPPORTED_FILE_SIZE));
        }

        if (!file.fileobj) {
            // return onerror('Invalid file object at filetrans.');
            return onerror(errhandler.getmsg(errcodes.UI_INVALID_FILE_OBJECT_FILETRANS));
        }

        console.log('file is ' + [file.name, fsize, file.type].join(' '));

        var wait = getWait(fsize);

        logger.debug('chunk size: ' + file.chunksize + ' send interval: ' + wait);

        file.offset = 0;
        file.qtimer = setInterval(function () {
            try {
                if (file.sendControl >= file.offset) {
                    return;
                }
                
                if (file.iscancelled) {
                    clearInterval(file.qtimer);
                    logger.debug("file transfer was cancelled")
                    return;
                }

                if (file.offset >= fsize) {
                    clearInterval(file.qtimer);
                    logger.debug("file transfer complete, offset bytes: " + file.offset);
                    return oncomplete(hash);
                }
                
                file.read().then(result => {
                    onread(result);
                }).catch(err => {
                    file.iserror = true;
                    if (err.message == errcodes.UI_IN_SENDING_FILE) {
                        throw new Error('Max file size already exceeded');
                    }
                    
                    return onerror(err);
                });
            }
            catch (err) {
                logger.error('file send error %j', err);
            }
        },
        wait);
    }


    //  public methods
    fproc.initsend = function (fileobj, filename, filesize, filehash, filetype, filepath, onread, oncomplete, onerror) {

        fproc.connection = 0;

        if (!filename || !filehash) {
            // throw new Error("Invalid file");
            throw new Error(errhandler.getmsg(errcodes.UI_INVALID_FILE));
        }

        if (filesize === 0) {
            // throw new Error('File is empty, please select a non-empty file');
            throw new Error(errhandler.getmsg(errcodes.UI_FILE_IS_EMPTY_SELECT_FILE));
        }

        if (!filetype) {
            //TODO get/guess more properly the MIME type
            filetype = "text/plain";
        }

        var item = new fileItem(fileobj, filename, filesize, filehash, filetype, filepath);
        fproc.list_of_sendfiles[filehash] = item;

        sendproc(filehash, onread, oncomplete, onerror);

        //
    }

    fproc.initreceive = function (options, oncomplete) {
        try {

            if (!options || !options.file || !options.file.size || !options.file.name || !options.file.hash)
                // throw new Error("Invalid file");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_FILE));

            var hash = options.file.hash;
            var file = new fileItem(null, options.file.name, options.file.size, hash, options.file.type, null, null, options.file.actiontype, options.contact);
            file.oncomplete = oncomplete || function () { };

            fproc.list_of_rcvfiles[hash] = file;

            logger.debug("FileTransfer from " + options.contact.name + " file size: " +
                options.file.size + " file name: " + options.file.name + " file type: " + options.file.type);

        }
        catch (err) {
            // streembit.notify.error("File receive error %j", err);
            streembit.notify.error(errhandler.getmsg(errcodes.UI_FILE_RECEIVE_ERR, err));
        }
    }

    module.exports = fproc;

}());

