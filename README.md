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

Set the nwmode false to run the Streembit UI as we web application. (We run it using NGINX but any web server should be able to serve the content.) Streembit is a desktop application, so normally the nwmode flag is true.
The default value of wsprotocol is "https".

Please refer to the [jspm.md](jspm.md) readme file which explains installing and configuring jspm.

---------------

