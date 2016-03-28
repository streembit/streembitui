### Build Streemio

The Streemio user interface is a NodeJs application which uses the node-webkit (NW.js) library. NW.js is an app runtime based on Chromium.

To build Streemio from source first you must build Chromium, and then the node-webkit library. 

To build NW.js please refer to the NW.js [build documentation](http://docs.nwjs.io/en/latest/For%20Developers/Building%20NW.js/).

To build Chromium please refer to the Chromium project web site.

(Build summary)[https://www.chromium.org/nativeclient/how-tos/build-tcb]
 
(Get the code)[http://www.chromium.org/developers/how-tos/get-the-code]
 
(Windows build instructions)[https://www.chromium.org/developers/how-tos/build-instructions-windows]


Run Streemio from source 
------------------------

Clone the streemio repository:  

```bash
$ git clone https://github.com/streemio-org/streemio
$ cd /streemio
```

Install the dependencies:  

```bash
$ npm install
```

Run Streemio:  
```bash
$ /path/to/nw . 
```
(The package.json file must exists in the Streemio directory)


Create the Streemio package
---------------------------

Once Chromium and NW.js is built create the Streemio package by running the platform specific build file from the Streemio/build source directory.

Windows 64-bit build: execute the build/build_win64.bat file from the windows command line.

Linux 64-bit build: execute the build/build_linux64.sh file from the Linux terminal.

MacOS build: execute the build/build_macos64.sh file from the terminal.
