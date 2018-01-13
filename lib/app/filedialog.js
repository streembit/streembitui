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

var filesaver = require("filesaver");

(function () {

    var fdialog = {};

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

    fdialog.initialize = function (options) {
        this._options = options;

        if (typeof this._options.window !== "undefined")
            this.window = this._options.window;

        if (!this.window) this.window = window || null;

        this.element = null;
    };


    fdialog._createElement = function (changeeventfn) {

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
    fdialog.setWindow = function (window) {
        this.window = window;
    };

    /** Show dialog
     * @param {function} cb callback
     */
    fdialog.create = function (cb, changeeventfn) {
        var element = this._createElement();
        cb = cb || function () { };
        cb(null, element);
    };

    /** Get a file path by a dialog
     * @param {function} cb callback
     */
    fdialog.getFilePath = function (cb) {

        var self = this;

        self.create(function (err, element) {

            element.addEventListener('change', function (evt) {
                var files = evt.target.files;

                if (!files || !files.length) {
                    return cb(new NoSelectedFile("No file selected"), null);
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
    fdialog.readFile = function (options, cb) {

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


    fdialog.readTextFile = function (options, cb) {

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


    fdialog.saveTextFile = function (data, filename, cb) {

        filesaver(
            new Blob([data], { type: "text/plain;charset=" + document.characterSet }),
            filename
        );

        cb();
    };

    module.exports = fdialog;

}());
