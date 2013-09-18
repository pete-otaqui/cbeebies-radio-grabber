var sqlite3 = require('sqlite3');
var parser = require('blindparser');
var request = require('request');
var url = require('url');
var filed = require('filed');
var nodemailer = require("nodemailer");

var db = new sqlite3.Database('database.db');



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
                        db.run('INSERT INTO downloads VALUES (?)', link);
                        sendMail('New CBeebies Radio show ... ' + file);
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



var smtpTransport = nodemailer.createTransport("SMTP",{
   service: "Mandrill",
   auth: {
       user: "pete@otaqui.com",
       pass: "F9WPPDB-tCYL12d-dxhYDQ"
   }
});
var sendmailTransport = nodemailer.createTransport('sendmail', {
    path: '/usr/sbin/sendmail',
    args: [
        '-t', '-f', 'pete@otaqui.com'
    ]
});

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