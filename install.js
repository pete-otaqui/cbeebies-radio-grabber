var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('database.db');

db.serialize(function() {
    db.run('CREATE TABLE downloads (url TEXT)', function(err) {
    });
    db.run('DELETE FROM downloads');
});

db.close();
