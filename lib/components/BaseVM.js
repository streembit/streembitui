
export default class BaseVM {
    constructor(params) {
        this.route = null;
        this.page = null;
        if (params && params.route) {
            this.route = params.route;
        }
        if (params && params.page) {
            this.page = params.page;
        }
    }
}

