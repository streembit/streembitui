## Streembit 

Building Streembit
-----------------

The build workflow is described in [BUILD.md](BUILD.md).


**jspm configuration**
Please refer to the [jspm.md](jspm.md) readme file which explains installing and configuring jspm.

---------------

You must create a config.app.json configuration file in the lib folder, the same location where the config.json file is placed.
Put the following to the config.app.json
```json
{
    "nwmode": true,
    "wsprotocol":  "https"
}
```

The nwmode indicates whether or not run execute the software as a nwjs desktop application. The nwmode = true will run the application as a nwjs desktop app.

In the index.html at the header script section set the following to true:<br />
streembit.globals.nwmode = true;

The true value of streembit.globals.nwmode is also required to execute the software as nwjs desktop application. Streembit primarily is a desktop application, so normally the nwmode flag is true.

The default value of wsprotocol is "https".

---------------

**Run Streembit as a website** 

The application can be executed as as website. Perform the following steps to run it as website.

Step 1:<br />
At index.html set the following to false:<br />
streembit.globals.nwmode = false;

Step 2:<br />
Set the nwmode false config.app.json to run the Streembit UI as a web application. We run Streembit via the web using NGINX, but any web server should be able to serve the content. For development purpose use the http-server nodejs application to run Streembit as a website.


---------------

