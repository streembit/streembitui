// require.js looks for the following global when initializing
var require = {
    baseUrl: ".",
    paths: {
        "bootstrap":            "bower_components/components-bootstrap/js/bootstrap",
        "crossroads":           "bower_components/crossroads/dist/crossroads.min",
        "hasher":               "bower_components/hasher/dist/js/hasher.min",
        "jquery":               "bower_components/jquery/dist/jquery",
        "i18next":              "bower_components/i18next/i18next",
        "knockout":             "bower_components/knockout/dist/knockout",
        "signals":              "bower_components/js-signals/dist/signals.min",
        "text":                 "bower_components/requirejs-text/text",
        "appsrvc":              "app/services/appsrvc",
        "accountsrvc":          "app/services/accountsrvc",
        "localsrvc":            "app/services/localsrvc"
    },
    shim: {
        "bootstrap":            { deps: ["jquery"] },
        "jquery-mockjax":       { deps: ["jquery"] }
    }
};
