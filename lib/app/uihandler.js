
(function () {
    var ko, $;

    var uihandler = {

        init: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;
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

    if (typeof module !== 'undefined') {
        module.exports = uihandler;
    }
    else {
        window.uihandler = uihandler;
    }
})();
