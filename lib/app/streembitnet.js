
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

        this.netclient = null;
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new StreembitNet(symobj);

        return this[symobj]
    }

    get client() {
        return this.netclient;
    }

    set client(value) {
        this.netclient = value;
    }

    netfactory() {
        return new PeerToPeerNet();
    }

    getseeds () {
        if (!this.netclient) {
            return [];
        }
        else {
            return this.netclient.getseeds();
        }
    }    

    init() {
        this.netclient = null;
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            // get the network factory
            this.netclient = this.netfactory();
            this.netclient.init().
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

