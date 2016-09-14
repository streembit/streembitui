'use strict';

var streembit = streembit || {};
streembit.services = streembit.services || {};

define(['knockout', 'jquery'], function (ko, $) {
    var srvc = {
        is_network_init: ko.observable(false),
        network_type: streembit.DEFS.PUBLIC_NETWORK
    };

    //debugger;

    var config = (function (module) {

        var config_data = {
            "isdevmode": false, //  set this to true when run the software with "\path\to\nw\nw.exe ." so in development mode 
            "loglevel": "info",
            "transport": streembit.DEFS.TRANSPORT_TCP,
            "wsfallback": true,
            "tcpport": streembit.DEFS.APP_PORT,
            "wsport": streembit.DEFS.WS_PORT,
            "bootseeds": [
                { "address": "seed.streemio.org", "port": 32320, "public_key": "033b726f5ff2fc02a009ab2ef0844b807372af4b13d1236c2df9752de1ee93f5fa" },
                { "address": "seed.streemio.net", "port": 32320, "public_key": "033d92278f9440c8b4061dddf862f5e224d0ff312e642edfa2c93c86671442609f" },
                { "address": "seed.streemio.biz", "port": 32320, "public_key": "026f2303d7932ed86bf21b7150bcd45024f3926d37b615798855994b6b53e8b81b" },
                { "address": "seed.streemo.uk", "port": 32320, "public_key": "035f4881a0c7d50af6fcf7cc40c3eab60c382bf7f8cd83cd2a3ff5064afd893c70" }
            ],
            "ice_resolvers": [
                { "url": "stun:stun.l.google.com:19302" }, { "url": "stun:stun1.l.google.com:19302" }, { "url": "stun:stun2.l.google.com:19302" }
            ],
            "private_net_seed": { "account": "", "host": "", "port": 0 },
            "pending_contacts": []
        };


        Object.defineProperty(module, "data", {
            get: function () {
                return config_data;
            },

            set: function (value) {
                config_data = value;
            }
        });

        Object.defineProperty(module, "isdevmode", {
            get: function () {
                return config_data.isdevmode;
            },

            set: function (value) {
                config_data.isdevmode = value;
            }
        });

        Object.defineProperty(module, "loglevel", {
            get: function () {
                return config_data.loglevel || "debug";
            },

            set: function (value) {
                config_data.loglevel = value;
            }
        });

        Object.defineProperty(module, "transport", {
            get: function () {
                return config_data.transport || streembit.DEFS.TRANSPORT_TCP;
            },

            set: function (value) {
                config_data.transport = value;
            }
        });

        Object.defineProperty(module, "wsfallback", {
            get: function () {
                return config_data.wsfallback;
            },

            set: function (value) {
                config_data.wsfallback = value;
            }
        });

        Object.defineProperty(module, "tcpaddress", {
            get: function () {
                return config_data.tcpaddress;
            },

            set: function (value) {
                config_data.tcpaddress = value;
            }
        });

        Object.defineProperty(module, "tcpport", {
            get: function () {
                return config_data.tcpport || streembit.DEFS.APP_PORT;
            },

            set: function (value) {
                config_data.tcpport = value;
            }
        });

        Object.defineProperty(module, "wsport", {
            get: function () {
                return config_data.wsport || streembit.DEFS.WS_PORT;
            },

            set: function (value) {
                config_data.wsport = value;
            }
        });

        Object.defineProperty(module, "bootseeds", {
            get: function () {
                return config_data.bootseeds;
            },

            set: function (value) {
                config_data.bootseeds = value;
            }
        });

        Object.defineProperty(module, "ice_resolvers", {
            get: function () {
                return config_data.ice_resolvers;
            },

            set: function (value) {
                config_data.ice_resolvers = value;
            }
        });

        Object.defineProperty(module, "private_net_seed", {
            get: function () {
                return config_data.private_net_seed;
            },

            set: function (value) {
                config_data.private_net_seed = value;
            }
        });

        module.set_config = function (obj) {
            module.data = obj;
        }

        return module;

    } ({}));


    srvc.config = config;
    
    return srvc;
});



