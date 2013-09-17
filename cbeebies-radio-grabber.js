var sqlite3 = require('sqlite3');
var parser = require('blindparser');
var request = require('request');
var url = require('url');
var filed = require('filed');

var db = new sqlite3.Database('database.db');

parser.parseURL('http://downloads.bbc.co.uk/podcasts/radio/cr/rss.xml', function(err, out) {
    if ( err ) {
        console.log(err);
        return;
    }
    out.items.forEach(function(item, index) {
        if ( index > 10 ) return;
        var link = item.link[0];
        var filename = url.parse(link).pathname.split("/").pop();
        db.get('SELECT * FROM downloads WHERE url = ?', link, function(err, row) {
            var file;
            if ( row === undefined ) {
                file = filed('downloads/' + filename)
                    .on('end', function() {
                        db.run('INSERT INTO downloads VALUES (?)', link);
                    })
                    .on('error', function(err) {
                        console.log('FILE ERROR', filename, err);
                    });
                request(link)
                    .pipe(file)
                    .on('data', function(data) {
                        // console.log('binary data received', index);
                    })
                    .on('error', function(err) {
                        console.log('REQUEST ERROR', link, err);
                    });
            }
        });
    });
});

