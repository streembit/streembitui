import $ from 'jquery';
import bootstrap from 'bootstrap';
import 'bootstrap/css/bootstrap.css!';
import './css/streembit.css!';
import config from './config/config.json!';
import ko from "knockout";

export function init() {
    alert(config.tcpaddress);
    //debugger;
    // bootstrap code here
    var s = $.trim('   aaa    ');

    var crypto = require("crypto");
    var hashhex = crypto.createHash('sha1').update(s).digest().toString('hex');
    alert(hashhex);
}

export class App {
    constructor() {
    }

    init() {
        return new Date();
    }
}