/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define(['knockout', 'appevents', './infotask', './tasks.html!text'], function (ko, appevents, InfoTask, template) {
        function TasksViewModel(params) {

            var viewModel = {
                tasks: ko.observableArray([]),
                isshowpanel: ko.observable(false),

                dispose: function () {
                    console.log("TasksViewModel dispose");
                    appevents.removeSignal("on-task-event", viewModel.onTaskEvent);
                },

                init: function () {
                    // add event listners
                    appevents.addListener("on-task-event", viewModel.onTaskEvent);
                },

                // this VM manages the tasks and progress list
                onTaskEvent: function (event, param1, param2, param3) {
                    try {
                        switch (event) {
                            case "add":
                            case "connect":
                            case "connected":
                            case "update":
                            case "complete":
                            case "error":
                            case "close":
                                viewModel[event](param1, param2, param3);
                                break;
                            default:
                                break;
                        }
                    }
                    catch (err) {
                    }
                },

                add: function (task) {
                    try {
                        if (task) {
                            var obj;
                            switch (task.proc) {
                                case "info":
                                    obj = (typeof InfoTask == "function") ? InfoTask : (typeof InfoTask.default == "function") ? InfoTask.default : null;
                                    break
                                default:
                                    throw new Error("invalid task proc attribute");
                            }                            
                            if (!obj) {
                                throw new Error("invalid Infotask object");
                            }
                            var itemvm = new obj(task);
                            this.tasks.push(itemvm);
                            viewModel.isshowpanel(true);
                        }
                    }
                    catch (err) {
                        streembit.notify.error("Add task error %j", err, true);
                    }
                },

                close_task: function (item, ev) {
                    viewModel.tasks.remove(item);
                    if (viewModel.tasks().length == 0) {
                        viewModel.isshowpanel(false);
                    }
                },

                cancel_by_peer: function (taskid) {
                    var task = null;
                    for (var i = 0; i < this.tasks().length; i++) {
                        if (this.tasks()[i].taskid == taskid) {
                            task = this.tasks()[i];
                            break;
                        }
                    }
                    if (task) {
                        task.onerror("The task was cancelled by the peer");
                    }
                },

                connected: function (mode, taskid, value) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        task.onconnected();
                    }
                },

                connect: function (mode, taskid, value) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        task.onconnect();
                    }
                },

                update: function (mode, taskid, value) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        task.onupdate(value);
                    }
                },

                close: function (mode, taskid) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        viewModel.tasks.remove(task);
                        if (viewModel.tasks().length == 0) {
                            viewModel.isshowpanel(false);
                        }
                    }
                },

                complete: function (mode, taskid) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        task.oncomplete();
                    }
                },

                error: function (mode, taskid, err) {
                    var task = null;
                    var list = this.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].mode == mode && list[i].taskid == taskid) {
                            task = list[i];
                            break;
                        }
                    }
                    if (task) {
                        task.onerror(err);
                    }
                },

                exists: function (taskid, contactname){
                    var isexist = false;
                    var list = viewModel.tasks();
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].taskid == taskid && list[i].contact == contactname) {
                            isexist = true;
                            break;
                        }
                    }
                    return isexist;
                }
            };

            viewModel.init();

            // wire up this globally available function
            streembit.api.taskexists = viewModel.exists;

            return viewModel;
        }

        return {
            viewModel: TasksViewModel,
            template: template
        };
    });
} ());

