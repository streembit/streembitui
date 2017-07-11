/*

This file is part of DoorClient application. 
DoorClient is an open source project to manage reliable identities. 

DoorClient is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

DoorClient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with DoorClient software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/


'use strict';

(function () {

    define(
        ['appsrvc', 'appevents', 'uihandler', 'moisrvc', 'peermsg', 'utilities', 'buffer', 'filesaver', './filecabinets.html!text'],
        function (appsrvc, appevents, uihandler, moisrvc, peermsg, utilities, buffer, filesaver, template) {

            var readfile = function (file, callback) {
                try {
                    if (!window.FileReader) {
                        return callback('FileReader API is not supported by your browser.');
                    }

                    if (! file || !file.size) {
                        return callback('File is empty, please select a non-empty file');
                    }

                    const Buffer = buffer.Buffer;

                    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
                        chunkSize = 2097152,                             // Read in chunks of 2MB
                        chunks = Math.ceil(file.size / chunkSize),
                        currentChunk = 0,
                        buffersarr = [],
                        fileReader = new FileReader();

                    fileReader.onload = function (e) {
                        buffersarr.push(new Buffer(e.target.result));
                        currentChunk++;

                        if (currentChunk < chunks) {
                            loadNext();
                        }
                        else {
                            // concat the buffer
                           
                            const buf = Buffer.concat(buffersarr);
                            try {
                                var filecipher = peermsg.aes256encrypt(appsrvc.datacryptkey, buf);
                                return callback(null, filecipher);
                            }
                            catch (err) {
                                return callback("error in encrypting the file, " + err.message);
                            }
                        }
                    };

                    fileReader.onerror = function () {
                        callback('Error in reading the file and computing the file hash.');
                    };

                    function loadNext() {
                        var start = currentChunk * chunkSize,
                            end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

                        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
                    }

                    loadNext();

                }
                catch (e) {
                    callback("Error in reading the file: " + e.message);
                }
            };

            var encrypt = function (data) {
                // data must be string
                if (typeof data !== "string" && typeof data !== "String") {
                    throw new Error("data must be string to encrypt it")
                }
                var cipher = peermsg.aes256encrypt(appsrvc.datacryptkey, data);
                return cipher;
                };

            var decrypt = function (data) {
                // data must be string
                if (typeof data !== "string" && typeof data !== "String") {
                    throw new Error("data must be string to encrypt it")
                }
                var plain_text = peermsg.aes256decrypt(appsrvc.datacryptkey, data);
                return plain_text;
            };

            var encryptfile = function (file, callback) {

            };

            function DataItem(data) {

                if (data.client_data_type == 1) {  // text item
                    data.template = "text-item-template";
                    if (data.client_data_text) {
                        try {
                            var plaintext = decrypt(data.client_data_text);
                            data.client_data_text = plaintext;
                        }
                        catch (err) {
                            doorclient.notify.error("Error in encrypting data item", null, true);
                        }
                    }
                    if (data.client_data_title) {
                        try {
                            var plaintext = decrypt(data.client_data_title);
                            data.client_data_title = plaintext;
                        }
                        catch (err) {
                            doorclient.notify.error("Error in encrypting data item title", null, true);
                        }
                    }
                }
                else if (data.client_data_type == 2) { // file
                    data.template = "file-item-template";
                    if (data.client_data_title) {
                        try {
                            var plaintext = decrypt(data.client_data_title);
                            data.client_data_title = plaintext;
                        }
                        catch (err) {
                            doorclient.notify.error("Error in encrypting data item title", null, true);
                        }
                    }
                    else {
                        data.client_data_title = data.client_data_item.name;
                    }                    
                    data.filesize = utilities.format_bytes(data.client_data_item.size, 2)
                }                

                var viewModel = ko.mapping.fromJS(data);

                viewModel.iseditmode = ko.observable(false);
                viewModel.is_title_error = ko.observable(false);
                viewModel.is_data_error = ko.observable(false);
                viewModel.ndatemplate = ko.observable('empty-template');
                viewModel.ndarcptsearch = ko.observable('');
                viewModel.clientlist = ko.observableArray([]);

                viewModel.edit_item = function () {
                    viewModel.iseditmode(true);
                };

                viewModel.save_item = function () {                    
                    try {
                        var title = this.client_data_title().trim();
                        if (!title) {
                            return this.is_title_error(true);
                        }
                        this.is_title_error(false);

                        var text = this.client_data_text().trim();
                        if (!text) {
                            return this.is_data_error(true);
                        }
                        this.is_data_error(false);

                        var cipher_data = encrypt(text);
                        var cipher_title = encrypt(title);

                        var self = this;

                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                            data_item_id: this.client_data_id(),
                            data_text: cipher_data,
                            data_title: cipher_title
                        };

                        uihandler.blockwin();

                        moisrvc.sendauth("updatedataitem", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in creating drawer data");
                                }

                                self.iseditmode(false);

                                //
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in creating drawer data ", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in saving drawer %", e.message);
                    }
                };

                viewModel.cancel_edit = function () {
                    viewModel.iseditmode(false);
                };

                viewModel.share_item = function () {
                    // show the NDA template
                    viewModel.ndatemplate("assign-nda-template");
                    viewModel.ndarcptsearch("");
                    viewModel.clientlist([]);
                };

                viewModel.search = function () {
                    var searchval = viewModel.ndarcptsearch().trim();
                    if (searchval.length < 4) {
                        return;
                    }

                    viewModel.clientlist([]);

                    var data = {
                        email: appsrvc.email,
                        sessionid: appsrvc.sessionid,
                        data: searchval
                    };

                    //uihandler.blockwin();

                    moisrvc.send("searchclient", data,
                        function (ret) {
                            // unblock when ajax activity stops 
                            //uihandler.unblockwin();

                            if (!ret || ret.status != 0 || !ret.result) {
                                return doorclient.notify.error("Failed to search client name");
                            }

                            if (Array.isArray(ret.result) && ret.result.length > 0) {
                                viewModel.clientlist(ret.result);
                            }

                        },
                        function (err) {
                            // unblock when ajax activity stops 
                            //uihandler.unblockwin();
                            doorclient.notify.error("Error in searching client name ", err);
                        }
                    );

                };

                viewModel.cancel_share_item = function () {
                    // show the NDA template
                    viewModel.ndatemplate("empty-template");
                    viewModel.ndarcptsearch("");
                    viewModel.clientlist([]);
                };

                viewModel.assign_nda = function () {
                    // show the NDA template
                    viewModel.ndasection("empty-template");
                };

                viewModel.download_file = function () {
                    //debugger;
                    function download(id, callback) {
                        var data = {
                            data_item_id: id
                        };

                        uihandler.blockwin();

                        moisrvc.sendauth("downloadfile", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0 || !ret.result) {
                                    return doorclient.notify.error("Error in downloading file");
                                }

                                callback(ret.result);

                                //
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in downloading file %j", err);
                            }
                        );
                    }

                    var self = this;
                    download(this.client_data_id(), function (strdata) {
                        //var plaintext = decrypt(strdata);               
                        var plain_buffer = peermsg.decrypt_tobuffer(appsrvc.datacryptkey, strdata);
                        //var buf = utilities.b64ToArrBuff(plaintext);
                        //var buf = new TextEncoder("utf-8").encode(plaintext);
                        var blobitems = [];
                        blobitems.push(plain_buffer);
                        filesaver(
                            new Blob(blobitems, { type: self.client_data_item.type() }),
                            self.client_data_item.name()
                        );
                    });
                    
                };

                return viewModel;
            }

            function DrawerItem(client_drawer_id, client_drawer_name) {
                this.drawer_id = client_drawer_id;
                this.drawer_name = ko.observable(client_drawer_name);
                this.dataitems = ko.observableArray([]);
                this.iseditmode = ko.observable(false);
                this.new_data_item = ko.observable('');
                this.new_data_title = ko.observable('');

                this.file_selected = ko.observable(false);
                this.newfile = 0;
                this.newfile_path = ko.observable('');
                this.newfile_name = ko.observable('');
                this.newfile_type = ko.observable('');
                this.newfile_size = ko.observable('');
                this.newfile_size_text = ko.observable('');

                this.template = ko.observable('empty-template');
                this.is_title_error = ko.observable(false);
                this.is_data_error = ko.observable(false);
                this.is_file_error = ko.observable(false);
                this.is_opened = ko.observable(false);     

                this.on_file_change = function (file) {
                    if (!file) {
                        this.file_selected(false);
                        return;
                    }

                    this.file_selected(true);
                    this.newfile = file;
                    this.newfile_name(file.name);
                    this.newfile_path(file.path);
                    this.newfile_type(file.type);
                    this.newfile_size(file.size);
                    this.newfile_size_text(utilities.format_bytes(file.size, 2));

                    this.is_file_error(false);
                };

                this.delete_item = function (item, thisvm) {
                    //debugger;
                    var conf = confirm("Do you really want to delete this data item? The data will be deleted from the MOI database and cannot be restored.");
                    if (!conf) {
                        return;
                    }

                    try {
                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                            data_id: item.client_data_id()
                        };

                        moisrvc.sendauth("deletedataitem", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in deleting drawer data");
                                }

                                thisvm.get_data_items(function () {
                                });

                                //
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in deleting drawer data ", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in deleting drawer data %", e.message);
                    }
                }

                this.add_text = function (item, e) {
                    this.new_data_title('');
                    this.new_data_item('');
                    this.template("add-text-template");
                }

                this.complete_add_text = function () {
                    try {
                        var title = this.new_data_title().trim();
                        if (!title) {
                            return this.is_title_error(true);
                        }
                        this.is_title_error(false);

                        var text = this.new_data_item().trim();
                        if (!text) {
                            return this.is_data_error(true);
                        }
                        this.is_data_error(false);

                        var cipher_data = encrypt(text);
                        var cipher_title = encrypt(title);   

                        var self = this;

                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                            drawer_id: this.drawer_id,
                            drawer_data: cipher_data,
                            data_title: cipher_title
                        };

                        moisrvc.sendauth("createdrawerdata", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in creating drawer data");
                                }

                                self.template("empty-template");

                                self.get_data_items();

                                //
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in creating drawer data ", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in saving drawer %", e.message);
                    }
                }

                this.complete_add_file = function () {
                    try {
                        var title = this.new_data_title().trim();
                        if (!title) {
                            return this.is_title_error(true);
                        }
                        this.is_title_error(false);

                        var file = this.newfile;
                        var name = this.newfile_name();
                        var path = this.newfile_path();
                        var type = this.newfile_type();
                        var size = this.newfile_size();
                        if (!file || !name || !path || !type || !size ) {
                            return this.is_file_error(true);
                        }
                        this.is_file_error(false);                       

                        // invoke blockui
                        uihandler.blockwin();

                        var self = this;                        

                        var cipher_title = encrypt(title);   

                        readfile(file, function (err, cipher) {
                            if (err) {
                                uihandler.unblockwin();
                                return doorclient.notify.error("Error in saving file %j", err);
                            }
                            if (!cipher) {
                                uihandler.unblockwin();
                                return doorclient.notify.error("Unexpected error in encrypting the file");
                            }

                            try {
                                var details = {
                                    name: name,
                                    size: size,
                                    type: type
                                };

                                var data = {
                                    drawer_id: self.drawer_id,
                                    file_data: cipher,
                                    file_details: details,
                                    data_title: cipher_title
                                };

                                moisrvc.sendauth("newdrawerfile", data,
                                    function (ret) {
                                        // unblock when ajax activity stops 
                                        uihandler.unblockwin();

                                        if (!ret || ret.status != 0) {
                                            return doorclient.notify.error("Error in saving file");
                                        }

                                        self.template("empty-template");

                                        self.get_data_items();

                                        //
                                    },
                                    function (err) {
                                        // unblock when ajax activity stops 
                                        uihandler.unblockwin();
                                        doorclient.notify.error("Error in saving file ", err);
                                    }
                                );
                            }
                            catch (e) {
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in saving file %", e.message);
                            }
                        });
                        
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in saving file %", e.message);
                    }
                }

                this.add_file = function (item, e) {
                    this.is_file_error(false);
                    this.file_selected(false);
                    this.newfile_name('');
                    this.newfile_path('');
                    this.newfile_type('');
                    this.newfile_size(0);
                    this.newfile_size_text('');
                    this.newfile = 0;
                    this.template("add-file-template");
                }

                this.cancel_add_dataitem = function () {
                    this.template("empty-template");
                    this.file_selected(false);
                    this.newfile_name('');
                    this.newfile_path('');
                    this.newfile_type('');
                    this.newfile_size(0);
                    this.newfile = 0;
                    this.newfile_size_text('');
                }

                this.edit_drawer = function (item, e) {
                    this.iseditmode(true);
                }

                this.save_drawer = function (item, e) {
                    try {
                        var name = this.drawer_name().trim();
                        if (!name) {
                            return doorclient.notify.error("The drawer name is required");
                        }

                        var self = this;

                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                            drawer_id: this.drawer_id,
                            drawer_name: name
                        };

                        moisrvc.sendauth("savedrawer", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in saving drawer");
                                }

                                self.iseditmode(false);
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in saving drawer ", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in saving drawer %", e.message);
                    }
                }

                this.cancel_drawer_edit = function (item, e) {
                    this.iseditmode(false);
                }

                this.get_data_items = function (callback) {
                    try {
                        var self = this;

                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                            drawer_id: this.drawer_id
                        };

                        moisrvc.sendauth("getdraweritems", data,
                            function (ret) {              
                                if (!ret || ret.status != 0) {
                                    uihandler.unblockwin();
                                    return doorclient.notify.error("Error in populating drawer items");
                                }

                                if (ret.result && Array.isArray(ret.result)) {
                                    self.dataitems([]);
                                    ret.result.forEach(function (item) {
                                        self.dataitems.push(new DataItem(item));
                                    });                                    
                                }

                                if (callback) {
                                    callback();
                                }

                                uihandler.unblockwin();

                                //
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in populating drawer items %j", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in populating drawer items %", e.message);
                    }
                }
            }

            function CabinetItem(client_cabinet_id, client_cabinet_name, ) {
                this.drawers = ko.observableArray([]);
                this.id = client_cabinet_id;
                this.name = ko.observable(client_cabinet_name);
                this.iseditmode = ko.observable(false);                

                this.edit_file_cabinet = function (item, e) {
                    this.iseditmode(true);                    
                }

                this.save = function (item, e) {                    
                    try {
                        var name = this.name().trim();
                        if (!name) {
                            return doorclient.notify.error("The cabinet name is required");
                        }

                        var self = this;

                        // invoke blockui
                        uihandler.blockwin();

                        var data = {
                           cabinet_id: this.id,
                           cabinet_name: name
                        };

                        moisrvc.sendauth("savefilecabinet", data,
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in saving file cabinets");
                                }

                                self.iseditmode(false);
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in saving file cabinets ", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in saving file cabinets %", e.message);
                    }
                }

                this.cancel_edit = function (item, e) {
                    this.iseditmode(false);
                }


            }

            function FileCabinetsVm(params) {

                var viewModel = {
                    cabinets: ko.observableArray([]),
                    isadd_drawer: ko.observable(false),
                    new_drawer_name: ko.observable(''),

                    dispose: function () {
                        try {
                            //
                            appevents.removeSignal("on-refresh-drawer", viewModel.getdata);
                        }
                        catch (err) {
                            doorclient.notify.error("FileCabinetsVm dispose %j", err, true);
                        }
                    },

                    on_item_click: function (item, e) {
                        //debugger;
                        var drawer_id = item.drawer_id;
                        if (!item.is_opened()) {
                            item.get_data_items(function () {
                                var element = e.currentTarget;
                                $('.glyphicon', element)
                                    .toggleClass('glyphicon-chevron-right')
                                    .toggleClass('glyphicon-chevron-down');

                                item.is_opened(true);
                            });
                        }
                        else {
                            var element = e.currentTarget;
                            $('.glyphicon', element)
                                .toggleClass('glyphicon-chevron-right')
                                .toggleClass('glyphicon-chevron-down');

                            item.is_opened(false);
                        }
                    },

                    add_drawer: function (item, e) {
                        viewModel.isadd_drawer(true);
                    },

                    cancel_add: function (item, e) {
                        viewModel.isadd_drawer(false);
                    },

                    complete_add: function (item, e) {
                        try {
                            var name = viewModel.new_drawer_name().trim();
                            if (!name) {
                                return doorclient.notify.error("The drawer name is required");
                            }

                            var self = viewModel;

                            // invoke blockui
                            uihandler.blockwin();

                            var data = {
                                cabinet_id: item.id,
                                drawer_name: name
                            };

                            moisrvc.sendauth("createdrawer", data,
                                function (ret) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();

                                    if (!ret || ret.status != 0) {
                                        return doorclient.notify.error("Error in adding drawer");
                                    }

                                    self.isadd_drawer(false);
                                    self.getdata();

                                    //
                                },
                                function (err) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();
                                    doorclient.notify.error("Error in adding drawer %j", err);
                                }
                            );
                        }
                        catch (e) {
                            uihandler.unblockwin();
                            doorclient.notify.error("Error in adding drawer %", e.message);
                        }
                    },

                    
                    delete_drawer: function (item, e) {
                        var conf = confirm("Do you really want to delete this drawer? All data in the drawer will be deleted and cannot be restored.");
                        if (!conf) {
                            return;
                        }

                        try {
                            var self = viewModel;

                            // invoke blockui
                            uihandler.blockwin();

                            var data = {
                                drawer_id: item.drawer_id
                            };

                            moisrvc.sendauth("deletedrawer", data,
                                function (ret) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();

                                    if (!ret || ret.status != 0) {
                                        return doorclient.notify.error("Error in deleting drawer");
                                    }

                                    self.getdata();

                                    //
                                },
                                function (err) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();
                                    doorclient.notify.error("Error in deleting drawer %j", err);
                                }
                            );
                        }
                        catch (e) {
                            uihandler.unblockwin();
                            doorclient.notify.error("Error in deleting drawer %", e.message);
                        }
                    },

                    getdata: function () {
                        try {
                            var self = this;

                            this.cabinets([]);

                            // invoke blockui
                            uihandler.blockwin();

                            moisrvc.sendauth("getfilecabinets", {},
                                function (ret) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();

                                    if (!ret || ret.status != 0) {
                                        return doorclient.notify.error("Error in getting file cabinets");
                                    }

                                    if (ret.result) {

                                        var collection = [];
                                        ret.result.forEach((item) => {
                                            var added = false;
                                            for (var i = 0; i < collection.length; i++) {
                                                if (collection[i].id == item.client_cabinet_id) {
                                                    collection[i].drawers.push(new DrawerItem(item.client_drawer_id, item.client_drawer_name));
                                                    added = true;
                                                    break;
                                                }
                                            }
                                            if (!added) {
                                                var cabinet = new CabinetItem(item.client_cabinet_id, item.client_cabinet_name);
                                                cabinet.drawers.push(new DrawerItem(item.client_drawer_id, item.client_drawer_name));
                                                collection.push(cabinet);
                                            }
                                        });

                                        self.cabinets(collection);
                                    }
                                },
                                function (err) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();
                                    doorclient.notify.error("Error in getting file cabinets", err);
                                }
                            );
                        }
                        catch (e) {
                            uihandler.unblockwin();
                            doorclient.notify.error("Error in getting file cabinets %", e.message);
                        }
                    },

                    init: function () {
                        appevents.addListener("on-refresh-drawer", viewModel.getdata)
                        viewModel.getdata();                       
                    }
                }

                viewModel.init();

                return viewModel;          
            }

            return {
                viewModel: FileCabinetsVm,
                template: template
            };
        }
    );

}());



