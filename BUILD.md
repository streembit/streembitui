Build Streembit
--------------

The Streembit core software is a Node.js application which uses the NW.js (node-webkit) library. NW.js is an app runtime based on Chromium. In order to build Streembit and it's dependencies from source you must be familiar with Node.js, the Chromium project and NW.js (node-webkit). Building Chromium and NW.js is a long process, you might want to download the trusted prebuilt binaries from the NW.js website instead: http://nwjs.io/downloads/

Follow the instructions below if you would like to build Chromium and NW.js from source.

To build Chromium please refer to the Chromium project web site.

[Build summary](https://www.chromium.org/nativeclient/how-tos/build-tcb)

[Get the Chromium code](http://www.chromium.org/developers/how-tos/get-the-code)

[Windows build instructions](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md)

To build NW.js please refer to the NW.js [build documentation](http://docs.nwjs.io/en/latest/For%20Developers/Building%20NW.js/).


Install Streembit dependencies
------------------------

Once the latest NW.js binaries are built (or downloaded) ensure that you also have node installed on your computer (https://nodejs.org/en/), and then clone the streembit repository:  

```bash
$ git clone https://github.com/streembit/streembitui
$ cd /streembitui
```
Install the Streembit Node.js dependencies:  
```bash
$ npm install
```
A few extra steps are required to configure jspm and install jspm packages.

First install jspm locally.
```bash
npm install jspm --save-dev
```

To load bower packages, the bower endpoint must be installed.
```bash
npm install jspm-bower-endpoint
```

Add bower registry endpoint
```bash
jspm registry create bower jspm-bower-endpoint
```

Please refer to the [jspm.md](jspm.md) readme file for more information.
Once jspm is configured enter
```bash
$ jspm install
```
Next you must create a configuration file named config.app.json in the lib folder, the same location where the config.json file is placed.
Put the following in the config.app.json file
```json
{
"nwmode": true,
"wsprotocol":  "https"
}
```

Set the nwmode to false to run the streembitui as a web application. (We run it using NGINX but any web server should be able to serve the content.) Streembit is a desktop application, so normally the nwmode flag is true.
The default value of wsprotocol is "https".

Run Streembit from source
------------------------

Now that you have installed the Streembit dependencies you can run it directly from source without building the executable. If you wish to go straight to building the executable, skip this step. Make sure you are still in the streembitui directory and follow the instructions below depending on your platform.

Run Streembit on Linux:  
```bash
$ /path/to/nw .
```
(The node-webkit executables you downloaded earlier must be in the /to directory if you run the above command. The package.json file must exist in the Streembit directory).

Run Streembit on Windows:  
```bash
$ /path/to/nw.exe .
```
(The node-webkit executables you downloaded earlier must be in the /to directory if you run the above command. The package.json file must exist in the Streembit directory).

Run Streembit on MacOS:

To install node-webkit on MacOS drop the downloaded .app file to the applications folder. Then ensure the package.json file exits in the Streembit directory and run this command:
```bash
$ /Applications/nwjs.app/Contents/MacOS/nwjs .
```

Build and create the Streembit executable
-----------------------------------------

Once you have built or downloaded NW.js, create the Streembit package by running the platform specific build file from the Streembit/build source directory.

Windows 64-bit build:  
Create a directory inside streembitui/build directory called "buildtools/win64". Build node-webkit from source or download the latest Windows 64-bit node-webkit binaries from the node-webkit project site, and copy it to the streembitui/build/buildtools/win64 directory.  
Execute the build/build_win64.bat file from the windows command line.

Linux 64-bit build:  
Create a directory inside streembitui/build directory called "buildtools/linux64". Build node-webkit from source or download the latest Linux 64-bit node-webkit binaries from the node-webkit project site, and copy it to the streembitui/build/buildtools/linux64 directory.    
Execute the build/build_linux64.sh file from the Linux terminal.

MacOS 64-bit build:  
Create a directory inside streembitui/build directory called "buildtools/macosx64". Build node-webkit from source or download the latest MAC OS X node-webkit binaries from the node-webkit project site, and copy it to the streembitui/build/buildtools/macosx64 directory.   
Execute the build/build_macosx64.sh file from the terminal.

Once Streembit is done building it will be zipped and placed in the build directory. 

Build the streembitseed application
-----------------------------------

To help and contribute to the stability of the Streembit network please run the streembitseed application. More seeds make the network more stable and by having more seeds deployed we can mitigate DDoS attacks and government interventions more effectively.  Also, if you wish to run your own Streembit network you must run your own streembitseed nodes. streembitseed is a Node.js application based on the streembitlib library, but without the Chromium/NW.js UI components. To build streembit-seed from source clone the [streembitseed source](https://github.com/streembit/streembitseed.git) and follow the instructions of to the readme.
