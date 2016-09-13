define(['jquery', 'knockout', './router', 'appsrvc', 'accountsrvc', 'bootstrap', 'i18next', 'localsrvc'],
    function ($, ko, router, appsrvc, accountsrvc, bootstrap, i18n, localsrvc) {
        // Components can be packaged as AMD modules, such as the following:
        ko.components.register('navbar', { require: 'components/navbar/navbar' });
        ko.components.register('contacts-bar', { require: 'components/contacts-bar/contacts-bar' });
        ko.components.register('initui', { require: 'components/initui/initui' });
        ko.components.register('connect-to-public', { require: 'components/connect-to-public/connect-to-public' });

        // ... or for template-only components, you can just point to a .html file directly:
        ko.components.register('about', {
            template: { require: 'text!components/about/about.html' }
        });

        //debugger;
        // initialize the local resource files
        require([
            'text!../resources/locals/en.json',
            'text!../resources/locals/de_DE.json',
            'text!../resources/locals/it_IT.json'], function (enFile, deFile, itFile) {
                var enjson = JSON.parse(enFile);
                var dejson = JSON.parse(deFile);
                var itjson = JSON.parse(itFile);
                //console.log(enjson);
                i18n.init(
                {
                    lng: "en",
                    resources: {
                        "en": enjson,
                        "de_DE": dejson,
                        "it_IT": itjson
                    }
                },
                function (err, t) {
                    //var x = t("testkey");
                    //console.log(x);
                    //x = t("userinit.view_header_createaccount");
                    //console.log(x);

                    localsrvc.init(t);

                    console.log("local resources are initialized");
                    // Start the application
                    ko.applyBindings({ route: router.currentRoute, appsrvc: appsrvc, accountsrvc: accountsrvc });
                }
            );
        })

        //localsrvc.init("resources/locals", "en");
        //var option = {
        //    customLoad: function (lng, ns, options, loadComplete) {
        //        // load the file for given language and namespace

        //        // callback with parsed json data
        //        loadComplete(null, data); // or loadComplete('some error'); if failed
        //    }
        //};

        //i18n.init(option);

        //i18n.init(
        //    {
        //        lng: "en",
        //        resStore: "resources/locals"
        //    },
        //    function (err, t) {
        //        var x = t("testkey");
        //        console.log(x);
        //    }
        //);

       
    }
);
