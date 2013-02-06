var pg = require('pg');
var util = require('./util');

function addFormatPage (header, response) {

    var body = '<html><head><title>Add Format</title>\n' +
	util.randomStyle()+
    	'</head><body>' +
	'<form name="the-form" action="/add-format" method="post">\n' +
	'<center><table bgcolor=white><tr><td align=center><hr><h2><marquee>'+
	header+
	'</marquee></h2><hr>\n' +
	'<tr><td align=center><input type="text" name="format" value="">\n' +
	'<tr><td align=center><BR><input type="submit" value="Add Format"><input type="reset" value="Clear">' +
	'<hr></form></table></center></body></html>';	

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

exports.setup = function setupHandlers (app) {

    app.get('/add-format', function(request, response) {
	addFormatPage('Add Format!', response);
    });
    
    app.post('/add-format', function(request, response) {
	util.readPostData(request, function(body) { 
	    pg.connect(process.env.DATABASE_URL, function(err, client) {
		var query = client.query('INSERT INTO formats (format) VALUES (\''+body['format']+'\');');	
		query.on('end', function(row) { 
		    addFormatPage('Added '+body['format']+' Format! Add Another?', response);
		});
	    });
	});
    });
}
