# Bower's cldr-data

Bower module for [Unicode CLDR JSON][] data.

[Unicode CLDR JSON]: http://cldr.unicode.org/index/cldr-spec/json

## Goal

- Allow i18n libraries to define CLDR data as versioned "peer" dependency.
- Empower end applications the manage the final flatten CLDR data.
- Provide tools to assist (in other words, ease the pain) on fetching and
  filtering the data.

Bonus goals

- Optimal for frontend development. (Backend, see [Npm's cldr-data][]).
- Optimal for AMD environment. (Node.js, see [Npm's cldr-data][]).

[Npm's cldr-data]: https://github.com/rxaviers/cldr-data-npm


## Usage

### End applications

If you're writing an end application that depends on i18n libraries, which
in turn define their CLDR data dependency using bower's `cldr-data`, you need
to:

1. List your i18n dependencies (obvious).
1. Setup a bower postinstall hook to populate the correct Unicode CLDR JSON data.

On the `bower.json` of your application, list the i18n dependencies as you'd
normally do. For example, let's say they are FooNumberFormat and BarDateFormat.

```javascript
"dependencies": {
  "foo-number-format": "1.2.3",
  "bar-date-format": "4.5.6"
}
```

If you don't have a `.bowerrc` file then create one.  On your `.bowerrc` file, define script hooks to actually fetch the correct
Unicode CLDR JSON data for you.  With this in place, when you enter `bower install` the lovely `cldr-data` will be included as part of the installation.

**Important:** If you have already installed your bower dependencies prior to defining your `.bowerrc` hook then subsequently entering `bower install` *will not install `cldr-data`*. 

```javascript
{
  "scripts": {
    "preinstall": "npm install cldr-data-downloader@0.2.x",
    "postinstall": "node ./node_modules/cldr-data-downloader/bin/download.js -i bower_components/cldr-data/index.json -o bower_components/cldr-data/"
  }
}
```

Unicode CLDR JSON data will be available at
`bower_components/cldr-data` (obviously, you can change that to your taste if
you want to).

Note that if you use AMD, you can use the below in your application.

```javascript
require.config({
  cldrData: "./bower_components/cldr-data",
  json: "./bower_components/requirejs-plugins/src/json",
  text: "./bower_components/requirejs-text/text"
});

require([
  "json!cldrData/main/en/numbers.json",
  "json!cldrData/supplemental/likelySubtags.json",
  ...
], function( enNumbers, likelySubtags, ... ) {

  // Your awesome application code goes here.

});
```

You can find more details (and give it a try) by switching to the
[Application Example][] branch.

[Application Example]: https://github.com/rxaviers/cldr-data-bower/tree/example-application

### I18n libraries

If you own or develop an i18n library, your life just got better. :p

On the `bower.json` of your i18n library, define its CLDR data dependency.

```javascript
"dependencies": {
  "cldr-data": ">=26"
}
```

That's it. End applications will now be able to provide your library the correct
version of CLDR data. For your convinience, use cldr-data in conjunction of
[cldr.js][].

You can find more details (and give it a try) by switching to the
[Foo Number Format Library Example][] branch.

[cldr.js]: https://github.com/rxaviers/cldrjs
[Foo Number Format Library Example]: https://github.com/rxaviers/cldr-data-bower/tree/example-library-foo

## How does it work?

This bower module doesn't actually mirror any Unicode CLDR JSON data as you may
have already noticed. The only piece of information we carry is its zips URLs
(see `index.json`), which are necessary to fetch the data. In consequence, this
dependency gets really light and fast to be processed by bower.

Each cldr-data-bower's `major.minor` version maps to a Unicode CLDR JSON with
the same number. For example, cldr-data-bower `26.0.0`, `26.0.1`, or `26.0.1`
all map to Unicode CLDR JSON `v26`. So, simply use major (and possibly minor,
e.g., 23.1) when defining it, e.g., `"cldr-data": ">=26"`.

What really matters is that this approach allows bower to do its job, i.e.,
dependency management.

Exemplifying, an end application that depends on Foo (that depends on cldr-data
\>= 25) and Bar (that depends on cldr-data \>= 23.1), can use bower to install
and to flatten its `cldr-data` dependency. In this case, it's any version bigger
or equal to twenty five (>=25).

At this point, bower installs the right `cldr-data` version into
`./bower_components/cldr-data`, which carries instructions on how to download
the CLDR JSON data.

A postinstall script, like cldr-data-downloader, must be used to actually
populate the above skeleton.

On any questions or problems, please file an issue.

## License

MIT © [Rafael Xavier de Souza](http://rafael.xavier.blog.br)
