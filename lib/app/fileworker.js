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
    var worker;

    function file_read_worker() {

        onmessage = function (e) {
            try {

                function broadcast(msg) {
                    var obj = {
                        type: "broadcast",
                        msg: msg
                    };
                    var msg = JSON.stringify(obj);
                    postMessage(msg);
                }

                function readFile(file, filehash) {
                    var chunkSize = 4096; // 8192; //16384;

                    var sliceFile = function (offset) {
                        var reader = new FileReader();
                        reader.onload = (function () {
                            return function (event) {
                                //postMessage({ hash: filehash, chunk: event.target.result, offset: offset, length: event.target.result.byteLength });
                                var arraybuffer = event.target.result;
                                var base64String = btoa(String.fromCharCode.apply(null, new Uint8Array(arraybuffer)));
                                var obj = {
                                    proc: "fread",
                                    hash: filehash,
                                    data: base64String,
                                    offset: offset,
                                    length: event.target.result.byteLength
                                };
                                var msg = JSON.stringify(obj);
                                postMessage(msg);
                                //console.log("posting chunk offset: " + offset);
                                if (file.size > offset + event.target.result.byteLength) {
                                    setTimeout(sliceFile, 5, offset + chunkSize);
                                }
                            };
                        })(file);

                        var slice = file.slice(offset, offset + chunkSize);
                        reader.readAsArrayBuffer(slice);
                    };

                    sliceFile(0);
                }

                var proctype = e.data[0];

                if (proctype == "readfile") {
                    var file = e.data[1],
                        filehash = e.data[2];
                    readFile(file, filehash);
                }
                else if (proctype == "broadcast") {
                    var msg = e.data[1];
                    broadcast(msg);
                }

            }
            catch (err) {
                postMessage(err.message);
            }
        };

    }

    var code = file_read_worker.toString();
    code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

    var blob = new Blob([code], { type: "application/javascript" });
    worker = worker || new Worker(URL.createObjectURL(blob));

    module.exports = worker;

})();