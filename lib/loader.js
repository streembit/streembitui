
export default class {
    constructor(elem) {
        this.textdom_elem_id = elem;
        this.infotext = "";
    }

    update_text() {
        $("#" + this.textdom_elem_id).text(this.infotext);
    }

    get info() {
        return this.infotext;
    }

    set info(value) {
        this.infotext = value;
        this.update_text();
    }
}

