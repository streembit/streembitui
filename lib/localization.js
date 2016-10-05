
import i18next from 'i18next';

class Localization {
    constructor() {
    }

    load() {
        return new Promise((resolve, reject) => {
            i18next.init({
                lng: 'en',
                resources: {
                    en: {
                        translation: {
                            "appname-title": "Streembit",
                            "appname-sub-title": "Decentralized, peer-to-peer, secure communication system for humans and machines",
                            "appload-streembit": "Load Streembit",
                            "appload-locals": "Load localization resources",
                            "appload-database": "Load database",
                            "appload-logger": "Load application logger",
                            "appload-kademlia": "Load Kademlia DHT"
                        }
                    },
                    de: {
                        translation: {
                            "appname-title": "German Streembit",
                            "appname-sub-title": "German Decentralized, peer-to-peer, secure communication system for humans and machines",
                            "appload-streembit": "German Load Streembit",
                            "appload-locals": "German Load localization resources",
                            "appload-database": "German Load database",
                            "appload-logger": "German Load application logger",
                            "appload-kademlia": "German Load Kademlia DHT"
                        }
                    }
                }
            },
            (err, t) => {
                if (!err) {
                    console.log('local resources loaded');
                    resolve();
                }
                else {
                    reject(err);
                }
            });
        });       
        
    }
}

export default new Localization();

