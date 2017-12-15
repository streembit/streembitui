## Streembit 

Building Streembit
-----------------

The build workflow is described in [BUILD.md](BUILD.md).

You must create a config.app.json configuration file in the lib folder, the same location where the config.json file is placed.
Put the following to the config.app.json
```json
{
    "nwmode": true,
    "wsprotocol":  "https"
}
```
At index.html set the following to true:
streembit.globals.nwmode = true;


**Run as a website** 

Step 1:
At index.html set the following to false:
streembit.globals.nwmode = false;

Step 2:
Set the nwmode false config.app.json to run the Streembit UI as a web application. (We run it using NGINX but any web server should be able to serve the content.) Streembit is a desktop application, so normally the nwmode flag is true.
The default value of wsprotocol is "https".

**jspm configuration**
Please refer to the [jspm.md](jspm.md) readme file which explains installing and configuring jspm.

---------------

