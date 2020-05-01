JSPM installation notes
-----------------------

There are a few extra steps are required to configure jspm and  install jspm packages.

First install jspm locally.
```bash
npm install jspm --save-dev
```

To load bower packages the bower endpoint must be installed.

```bash
npm install jspm-bower-endpoint --save-dev
```

Reference:
https://github.com/2fd/jspm-bower-endpoint> 


#### Add bower registry endpoint

```bash
jspm registry create bower jspm-bower-endpoint
```

Reference:
http://stackoverflow.com/questions/34774702/how-to-make-jspm-install-bower-dependencies




