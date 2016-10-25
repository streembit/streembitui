
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

        this.client = null;
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new StreembitNet(symobj);

        return this[symobj]
    }

    netfactory() {
        return new PeerToPeerNet();
    }

    getseeds () {
        if (!this.client) {
            return [];
        }
        else {
            return this.client.getseeds();
        }
    }    

    init() {
        this.client = null;
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            // get the network factory
            this.client = this.netfactory();
            this.client.init().
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

