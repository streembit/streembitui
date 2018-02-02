/*
This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Streembit team
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------
*/

'use strict';

import appevents from "appevents";
import logger from "logger";

let singleton = Symbol();
let singletonCheck = Symbol()

class Task {
    constructor(callinterval, callback) {
        this.m_interval = callinterval;
        this.m_completeproc = callback;
        this.m_lastexecute = 0;
    }

    get interval() {
        return this.m_interval;
    }

    get completeproc() {
        return this.m_completeproc;
    }

    get last() {
        return this.m_lastexecute;
    }
    set last(value) {
        this.m_lastexecute = value;
    }

    // time: current time
    execute(time) {
        try {
            if ((time - this.last) >= this.interval) {
                this.last = time;
                this.completeproc();
            }
        }
        catch (err) {
            // display the error in the taskbar
            streembit.notify.error("task execute error: %j", err, true);
        }
    }
}

class TaskHandler {
    constructor(enforcer) {
        if (enforcer != singletonCheck) {
            throw "Cannot construct singleton";
        }

        this.tasks = new Map();
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new TaskHandler(singletonCheck);
        }
        return this[singleton];
    }

    deleteTask(name) {
        try {
            this.tasks.delete(name);
        }
        catch (err) {
            logger.error("Deleting task error: %j", err);
        }
    }

    addTask(name, interval, callback) {
        if (!name || !interval || !callback || interval < 1000 || typeof callback != "function") {
            throw new Error("invalid task parameters");
        }

        var task = new Task(interval, callback);
        this.tasks.set(name, task);

        logger.info("Task " + name + " with interval " + interval + " ms was initialized");
    }

    taskHandler() {
        try {
            setInterval(
                () => {
                    var time = Date.now();
                    this.tasks.forEach(
                        (task, key) => {
                            task.execute(time);
                        }
                    );
                },
                1000
            );
        }
        catch (err) {
            // display the error in the taskbar
            streembit.notify.error("taskHandler error: %j", err, true);
        }
    }

    load() {
        return new Promise((resolve, reject) => {
            try {
                this.taskHandler();
                resolve();
            }
            catch (err) {
                reject(err)
            }
        });
    }
    
}


export default TaskHandler.instance;
