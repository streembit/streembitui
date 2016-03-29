Build Streemio
--------------

The Streemio Core software is a Node.js application which uses the NW.js(node-webkit) library. NW.js is an app runtime based on Chromium. In order to build Streemio from source you must be familiar with Node.js, the Chromium project and NW.js (node-webkit).

To build Streemio from source first you must build Chromium software and the NW.js (node-webkit) library. 

To build Chromium please refer to the Chromium project web site.

[Build summary](https://www.chromium.org/nativeclient/how-tos/build-tcb)
 
[Get the Chromium code](http://www.chromium.org/developers/how-tos/get-the-code)
 
[Windows build instructions](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md)

To build NW.js please refer to the NW.js [build documentation](http://docs.nwjs.io/en/latest/For%20Developers/Building%20NW.js/).


Run Streemio from source 
------------------------

Once Chromium and NW.js are built clone the streemio repository:  

```bash
$ git clone https://github.com/streemio-org/streemio
$ cd /streemio
```

Install the Streemio Node.js dependencies:  

```bash
$ npm install
```

Run Streemio:  
```bash
$ /path/to/nw . 
```
(The node-webkit executables must be in the /nw directory if you run the above command. The package.json file must exists in the Streemio directory).



Create the Streemio package
---------------------------

Once you have built Chromium and NW.js, create the Streemio package by running the platform specific build file from the Streemio/build source directory.

Windows 64-bit build: execute the build/build_win64.bat file from the windows command line.

Linux 64-bit build: execute the build/build_linux64.sh file from the Linux terminal.

MacOS build: execute the build/build_macos64.sh file from the terminal.



Build the streemio-seed application
-----------------------------------

To help and contribute to the stability of Streemio network please run the streemo-seed application. More seeds make the network more stable and having more seeds deployed we can mitigate DDoS attacks and government interventions more effectively.  Also, if you wish to run your own Streemio network you must run your own streemio-seed nodes. streemio-seed is a Node.js application based on the Streemio Core software, but without the Chromium/NW.js UI components. To build streemio-seed from source clone the [streemio-seed source](https://github.com/streemio-org/streemio-seed.git) and follow the instructions of to the [build readme](https://github.com/streemio-org/streemio-seed/blob/master/BUILD.md).

