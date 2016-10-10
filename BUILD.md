Build Streembit
--------------

The Streembit core software is a Node.js application which uses the NW.js (node-webkit) library. NW.js is an app runtime based on Chromium. In order to build Streembit and it's dependencies from source you must be familiar with Node.js, the Chromium project and NW.js (node-webkit). Building Chromium and NW.js is a long process, you might want to download the trusted prebuilt binaries from the NW.js website instead: http://nwjs.io/downloads/

Follow the instructions below if you would like to build Chromium and NW.js from source.

To build Chromium please refer to the Chromium project web site.

[Build summary](https://www.chromium.org/nativeclient/how-tos/build-tcb)

[Get the Chromium code](http://www.chromium.org/developers/how-tos/get-the-code)

[Windows build instructions](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md)

To build NW.js please refer to the NW.js [build documentation](http://docs.nwjs.io/en/latest/For%20Developers/Building%20NW.js/).


Run Streembit from source
------------------------

Once Chromium and NW.js are built clone the streembit repository:  

```bash
$ git clone https://github.com/streembit/streembitui
$ cd /streembitui
```

Install the Streembit Node.js dependencies:  

```bash
$ npm install
```

Run Streembit:  
```bash
$ /path/to/nw .
```
(The node-webkit executables must be in the /nw directory if you run the above command. The package.json file must exist in the Streembit directory).



Build and create the Streembit executable
-----------------------------------------

Once you have built Chromium and NW.js, create the Streembit package by running the platform specific build file from the Streembit/build source directory.

Windows 64-bit build:  
Build node-webkit from source or download the latest Windows 64-bit node-webkit binaries from the node-webkit project site, and copy it to the /build/buildtools/win64 directory.  
Execute the build/build_win64.bat file from the windows command line.

Linux 64-bit build:  
Build node-webkit from source or download the latest Linux 64-bit node-webkit binaries from the node-webkit project site, and copy it to the /build/buildtools/linux64 directory.    
Execute the build/build_linux64.sh file from the Linux terminal.

MacOS build:  
Build node-webkit from source or download the latest MAC OS X node-webkit binaries from the node-webkit project site, and copy it to the /build/buildtools/macosx64 directory.   
Execute the build/build_macosx64.sh file from the terminal.



Build the streembitseed application
-----------------------------------

To help and contribute to the stability of Streembit network please run the streemo-seed application. More seeds make the network more stable and having more seeds deployed we can mitigate DDoS attacks and government interventions more effectively.  Also, if you wish to run your own Streembit network you must run your own streembitseed nodes. streembitseed is a Node.js application based on the streembitlib library, but without the Chromium/NW.js UI components. To build streembit-seed from source clone the [streembitseed source](https://github.com/streembit/streembitseed.git) and follow the instructions of to the readme.
