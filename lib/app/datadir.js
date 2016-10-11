(function () {

    var dataDir = {

        makedir: function () {
            return new Promise(function (resolve, reject) {
                if (!streembit.globals.nwmode) {
                    return resolve();
                }

                var datapath = null;
                var datadir = 'data';

                var path = nwrequire('path');
                var fs = nwrequire('fs');

                // the data paths is in the same directory as the executable
                var wdir = process.cwd();
                datapath = path.join(wdir, datadir);

                console.log("application data path: %s", datapath);

                fs.open(datapath, 'r', function (err, fd) {
                    if (err && err.code == 'ENOENT') {
                        /* the directory doesn't exist */
                        fs.mkdir(datapath, function (err) {
                            if (err) {
                                // failed to create the log directory, most likely due to insufficient permission
                                reject(err);
                            }
                            else {
                                global.datapath = datapath;
                                resolve();
                            }
                        });
                    }
                    else {
                        global.datapath = datapath;
                        resolve();
                    }
                });        
            });

            
        }

    };

    module.exports = dataDir;
})();