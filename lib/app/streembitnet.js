
import appevents from "./libs/events/AppEvents"
import logger from './logger';
import PeerToPeerNet from './peernetwork';
import WebSocketNet from './wsnetwork';

let symobj = Symbol();

class StreembitNet {
    constructor(singleton) {
        if (symobj !== singleton) {
            throw new Error('Only one singleton instance is allowed.');
        }

        this.network = {};
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new StreembitNet(symobj);

        return this[symobj]
    }

    get node() {
        return this.network.node;
    }

    set node(value) {
        this.network.node = value;
    }

    netfactory() {
        return new PeerToPeerNet();
    }

    init() {
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            // get the network factory
            this.network = this.netfactory();
            this.network.init().
                then(() => {
                    resolve();
                })   
                .catch(function (err) {
                    reject(err);
                });   
        });
    }
}


export default StreembitNet.instance;


//(function () {

//    var appevents = require("./libs/events/AppEvents");
//    var logger = require('./logger');
//    var PeerToPeerNet = require ('./peernetwork');
//    var WebSocketNet = require('./wsnetwork');

//    var StreembitNet = {

//        network: {},

//        node: function () {
//            return network.node;
//        },

//        netfactory: function () {
//            return new PeerToPeerNet();
//        },

//        init: function () {
//            return new Promise((resolve, reject) => {
//                logger.debug("Initialize Streembit Network");

//                // get the network factory
//                this.network = this.netfactory();
//                this.network.init().
//                    then(() => {
//                        resolve();
//                    })
//                    .catch(function (err) {
//                        reject(err);
//                    });
//            });
//        }
//    }

//    module.exports = StreembitNet;

//})();