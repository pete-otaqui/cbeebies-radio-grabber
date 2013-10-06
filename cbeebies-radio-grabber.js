var sqlite3 = require('sqlite3');
var parser = require('blindparser');
var request = require('request');
var url = require('url');
var filed = require('filed');
var nodemailer = require("nodemailer");
var probe = require('node-ffprobe');
var fs = require('fs');

var db = new sqlite3.Database('database.db');


function logg(str) {
    var d = Date.now();
    fs.appendFile('debug.log', d + ': ' + str + '\n');
}


parser.parseURL('http://downloads.bbc.co.uk/podcasts/radio/cr/rss.xml', function(err, out) {
    if ( err ) {
        console.log(err);
        return;
    }
    out.items.forEach(function(item, index) {
        if ( index > 0 ) return;
        var link = item.link[0];
        var filename = url.parse(link).pathname.split("/").pop();
        db.get('SELECT * FROM downloads WHERE url = ?', link, function(err, row) {
            var file;
            if ( row === undefined ) {
                file = filed('downloads/' + filename)
                    .on('end', function() {
                        probe('downloads/' + filename, function(err, data) {
                            if ( !err && data.metadata.title ) {
                                var number = fs.readdirSync('./downloads/').length;
                                var title = data.metadata.title.replace(/cbeebies( radio)?: /i, '');
                                var new_filename = 'cbeebies ' + number + ' ' + title + '.mp3';
                                fs.renameSync('downloads/' + filename, 'downloads/' + new_filename);
                            }
                        });
                        db.run('INSERT INTO downloads VALUES (?)', link);
                        sendMail('New CBeebies Radio show ... ' + filename);
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



var smtpTransport = nodemailer.createTransport("SMTP", require('./config.json'));


function sendMail(text) {
    smtpTransport.sendMail(
        {
            from: "CBeebies Radio Grabber <pete@otaqui.com>", // sender address
            to: "Pete Otaqui <pete@otaqui.com>", // comma separated list of receivers
            subject: "CBeebies Radio Grabber", // Subject line
            text: text // plaintext body
        },
        function(error, response){
            if(error){
                logg(error);
            } else {
                logg("Message sent: " + response.message);
            }
            smtpTransport.close();
        }
    );
}
