JSPM installation notes
-----------------------

There are a few extra steps are required to configure jspm and  install jspm packages.

To load bower packages the bower endpoint must be installed.

```bash
npm install -save jspm-bower-endpoint
```

Reference:
https://github.com/2fd/jspm-bower-endpoint> 


#### Add bower registry endpoint

```bash
jspm registry create bower jspm-bower-endpoint
```

Reference:
http://stackoverflow.com/questions/34774702/how-to-make-jspm-install-bower-dependencies


#### Unregistered library management, shims

We must create shims for JS libraries that aren't registered in the JSPM register.
For example, below is the jquery Blocui plugin installation:

```bash
jspm install github:malsup/blockui -o "{ registry: 'jspm', main: 'jquery.blockUI', shim: { 'jquery.blockUI': { deps: [
'jquery'] } }, dependencies: { jquery: '*' } }"
```

where the command pulls the content from the github:malsup/blockui repository and creates a shim for it.

Reference and a great explanation of the shim based configurations:
http://bchavez.bitarmory.com/archive/2015/09/10/jspm-amp-third-party-library-shims.aspx

