
import i18next from 'i18next';

class Localization {
    constructor() {
    }

    load() {
        return new Promise((resolve, reject) => {
            i18next.init({
                lng: 'de',
                resources: {
                    en: {
                        translation: {
                            "appname-title": "Streembit",
                            "appname-sub-title": "Decentralized, peer-to-peer, secure communication system for humans and machines",
                            "appload-streembit": "Load Streembit",
                            "appload-application": "Load application",
                            "appload-components": "Loading UI components",
                            "appload-database": "Load database",
                            "appload-logger": "Load application logger",
                            "appload-kademlia": "Load Kademlia DHT",
                            "lbl-initui-connect": "Connect to Public Streembit",
                            "lbl-initui-connectpriv": "Connect to Private Streembit",
                            "lbl-initui-newaccount": "New Account",
                            "lbl-initui-initexisting": "Initialize Existing Account",
                            "lbl-initui-restore": "Restore Account"
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
                            "appload-kademlia": "German Load Kademlia DHT",
                            "lbl-initui-connect": "Verbunden mit Streembit",
                            "lbl-initui-connectpriv": "Verbunden mit Privatgelände Streembit",
                            "lbl-initui-newaccount": "Neues Konto",
                            "lbl-initui-initexisting": "Initialisieren Bestehenden Konto",
                            "lbl-initui-restore": "Wiederherstellung Konto"
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

