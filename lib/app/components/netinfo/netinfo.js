import User from "../../user";
import appsrvc from "../../appsrvc";
import streembitnet from "../../streembitnet";

export default class NetInfoVm {
    constructor(params) {
        this.route = params.route;
        this.account = ko.observable(User.name);
        this.public_key = ko.observable(User.public_key);
        this.seeds = ko.observableArray([]);
        this.port = ko.observable(appsrvc.port);
        this.address = ko.observable(appsrvc.address);
        this.upnpaddress = ko.observable(appsrvc.upnpaddress);
        this.upnpgateway = ko.observable(appsrvc.upnpgateway);
        this.transport = ko.observable(appsrvc.transport);
        this.net_connected = ko.observable(appsrvc.net_connected);

        var seedarray = streembitnet.getseeds();
        if (seedarray) {
            this.seeds(seedarray);
        }        
    }
}