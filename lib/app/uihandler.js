
(function () {
    var ko, $;
    var appevents = require("./streembitlib/events/AppEvents");

    var uihandler = {

        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            // error handler
            appevents.on(appevents.APP_UINOTIFY, function (type, msg) {
                console.log("APP_UINOTIFY" + " " + type + " " + msg);
            });
        },

        set_load_info: function(value) {
            $("#" + streembit.ui.load_info).text(value);
        },

        on_load_complete: function () {
            $("#" + streembit.ui.load_container).hide();
            $("#" + streembit.ui.navbar_section).show();
            $("#" + streembit.ui.main).show();
        }
    };

    module.exports = uihandler;
})();
