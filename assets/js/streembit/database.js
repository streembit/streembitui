
streembit.database = (function (db, logger) {

    var dbobj;

    db.migrate_indexeddb = function () {

    }

    db.open = function () {
        var dbSize = 50 * 1024 * 1024; // 5MB
        dbobj = openDatabase("streembitdb", "1", "streembitdb", dbSize);
    }


    db.initialize = function (callback) {
        // create the tables
        logger.debug("create SQL tables");

        callback();
    }
    

    return db;

} (streembit.database || {}, streembit.logger));

