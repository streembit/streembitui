
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
                            "appload-application": "Load application",
                            "appload-components": "Loading UI components",
                            "appload-database": "Load database",
                            "appload-logger": "Creating application logger",
                            "appload-kademlia": "Load Kademlia DHT",
                            "appload-streembitconn": "Connecting to Streembit network",
                            "lbl-initui-connect": "Connect to Public Streembit",
                            "lbl-initui-connectpriv": "Connect to Private Streembit",
                            "lbl-initui-newaccount": "New Account",
                            "lbl-initui-initexisting": "Initialize Existing Account",
                            "lbl-initui-restore": "Restore Account",
                            "lbl-createaccount-create": "Create new Streembit account",
                            "lbl-streembitacc": "Streembit account",
                            "lbl-privkeypassword": "Private key password",
                            "lbl-confirmpassword": "Confirm private key password",
                            "errmsg-createaccount-accountname": "The account name must be between 6-20 characters and it can only contain alphanumeric characters (letters a-z, A-Z and numbers 0-9)",
                            "errmsg-createaccount-exists": "The account already exists on the network. Please define an other account name",
                            "errmsg-createaccount-pwdrequired": "Password is required",
                            "errmsg-createaccount-pwdlength": "The password must be at least 8 characters",
                            "errmsg-createaccount-nospaceallowed": "The password must not contain empty space",
                            "errmsg-createaccount-lowercaseneed": "The password must contain at least one lower case letter",
                            "errmsg-createaccount-uppercaseneed": "The password must contain at least one upper case letter",
                            "errmsg-createaccount-digitneed": "The password must contain at least one digit",
                            "errmsg-createaccount-specialcharneed": "The password must contain at least one special character",
                            "errmsg-createaccount-pwdconfirm": "Password confirm input value is required",
                            "errmsg-createaccount-pwdconfirmmatch": "The password and its confirm are not the same"
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
                    console.log('Local resources loaded');
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

