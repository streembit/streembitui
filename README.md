## Streembit User Interface (UI) Application 

The Streembit User Interface (UI) application using the same code base can be executed either as a desktop application using the NW.js framework or as a standalone web application using a web server. 

For both mode clone the repository

```bash
$ git clone https://github.com/streembit/streembitui
$ cd /streembitui
```
Install the Streembit Node.js dependencies:  

```bash
$ npm install
```

The Streembit UI application uses the jspm module loader. Please refer to the [jspm.md](jspm.md) readme file which explains installing and configuring jspm.

Once jspm is configured enter
```bash
$ jspm install
```

---------------

Option No. 1: Run the Streembit UI as a desktop application
-----------------

You can download the latest NW.js framework from their repository at https://github.com/nwjs/nw.js. 

Alternatively, if you wish to build Chromium from source please refer to the Chromium project web site.

[Build summary](https://www.chromium.org/nativeclient/how-tos/build-tcb)
 
[Get the Chromium code](http://www.chromium.org/developers/how-tos/get-the-code)
 
[Windows build instructions](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md)

To build NW.js from source please refer to the NW.js [build documentation](http://docs.nwjs.io/en/latest/For%20Developers/Building%20NW.js/).

Once NW.js is downloaded or built you must create a config.app.json configuration file in the lib folder, the same location where the config.json file is placed.
Define the following to the config.app.json
```json
{
    "nwmode": true,
    "protocol":  "https"
}
```

The nwmode indicates whether or not run execute the software as a nwjs desktop application. The nwmode = true will run the application as a nwjs desktop app.

Must define "https" at the "protocol" field to run the web application over the HTTPS protocol. 

Run Streembit:  
```bash
$ /path/to/nw . 
```
Note, the node-webkit executables must be in the /nw directory if you run the above command. The package.json file must exists in the Streembit directory.

---------------

Option No. 2: Run the Streembit UI as a website
-------------------------

The application can be executed as as website. Perform the following steps to run it as website.

You must create a config.app.json configuration file in the lib folder, the same location where the config.json file is placed.
Define the following to the config.app.json
```json
{
    "nwmode": false,
    "protocol":  "https"
}
```

Pleae note, the nwmode variable is false in the config.app.json file to run the Streembit UI as a web application. We run Streembit via the web using NGINX, but any web server should be able to serve the content. For development purpose it is the easiest to use the http-server nodejs application to run Streembit as a website.

