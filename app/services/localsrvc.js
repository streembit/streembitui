'use strict';

define([
    'knockout', 'jquery', 'i18next',
    'text!../resources/locals/en.json',
    'text!../resources/locals/de_DE.json',
    'text!../resources/locals/it_IT.json'
    ],
    function (
        ko, $, i18n,
        enFile, deFile, itFile) {

    var koBindingHandler = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                var i = i18nextko._koElements.indexOf(element);
                if (i >= 0) {
                    i18nextko._koElements.splice(i, 1);
                    i18nextko._koCallbacks.splice(i, 1);
                }
            });
            i18nextko._koElements.push(element);
            i18nextko._koCallbacks.push(ko.bindingHandlers['i18n'].update.bind(undefined, element, valueAccessor, allBindingsAccessor, viewModel, bindingContext));
            koBindingHandler.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.toJS(valueAccessor());
            if (typeof value === 'string') {
                element.innerHTML = i18n.t(value);
            } else if (value.key) {
                element.innerHTML = i18n.t(value.key, value.options);
            } else {
                for (var attr in value) {
                    var options = value[attr];
                    var translation;
                    if (typeof options === 'string') {
                        translation = i18n.t(options);
                    }
                    else {
                        translation = i18n.t(options.key, ko.toJS(options.options));
                    }
                    if (attr == 'html') {
                        element.innerHTML = translation;
                    }
                    else {
                        var div = document.createElement('div');
                        div.innerHTML = translation;
                        element.setAttribute(attr, div.innerText);
                    }
                }
            }
        }
    };

    var i18nextko = {
        _koElements: [],
        _koCallbacks: [],
        i18n: null,

        setLanguage: function (language) {
            i18n.setLng(language);
            i18nextko._language(language);
            i18nextko._koCallbacks.forEach(function (c) {
                return c.call(undefined);
            });
            if (typeof $ !== 'undefined' && typeof $.fn.i18n !== 'undefined') {
                $('html').i18n();
            }
        },

        init: function (callback) {
            //this.i18n = i18obj;        
            //ko.bindingHandlers['i18n'] = koBindingHandler;   
            var enjson = JSON.parse(enFile);
            var dejson = JSON.parse(deFile);
            var itjson = JSON.parse(itFile);
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
                    ko.bindingHandlers['i18n'] = koBindingHandler;   
                    if (callback) {
                        callback();
                    }
                    console.log("local resources are initialized")
                }
            );
        },

        t: function () {
            var args = arguments;
            return ko.computed(function () {
                i18nextko._language(); //to auto-update this computed observable on language changes
                return i18n.t.apply(undefined, args);
            });
        }
    };

    i18nextko.init();

    return i18nextko;

});



