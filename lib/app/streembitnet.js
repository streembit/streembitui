
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

        this.net = {};
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new StreembitNet(symobj);

        return this[symobj]
    }

    netfactory() {

        return new PeerToPeerNet();
    }

    init() {
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            // get the network factory
            this.net = this.netfactory();

            //return this.net.init();
            this.net.init().
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


