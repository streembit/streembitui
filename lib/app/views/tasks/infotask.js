import ko from "knockout";

export default function (task) {
    var viewModel = {
        template: ko.observable('empty-template'),
        type: task.type,

        onupdate: function (value) {
            if (this.type == "file") {
                this.progress_val(value);
            }
        },

        onconnect: function () {
            this.template("peer-connect-template");
        },

        onconnected: function () {
            this.template(viewModel.type + "-progress-template");
        },

        oncomplete: function () {
            if (this.type == "file") {
                if (this.mode == "send") {
                    this.template("file-send-complete-template");
                }
                else if (this.mode == "receive") {
                    this.template("file-receive-complete-template");
                }
            }
        },

        onerror: function (err) {
            this.error_msg((err && err.message) ? err.message : err);
            this.template(task.type + "-error-template");
        }
    };

    if (!task || !task.mode || !task.type) {
        throw new Error("invalid task parameters");
    }

    for (var prop in task) {
        viewModel[prop] = task[prop];
    }

    if (task.showconnect) {
        viewModel.onconnect();
    }
    else {
        viewModel.template(task.type + "-progress-template");
    }

    viewModel.contact = (task.contact && task.contact.name) ? task.contact.name : "";

    if (task.type == "file") {
        viewModel.progress_val = ko.observable(0);
        viewModel.file_size = ko.observable(task.file_size);
        viewModel.error_msg = ko.observable('');
        viewModel.savedir = ko.observable('');
    }

    return viewModel;
}