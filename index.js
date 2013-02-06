var express = require('express');
var players = require('./players');
var drafts = require('./drafts');
var util = require('./util');

console.log('Starting server.');

var app = express(express.logger());

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

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

app.get('/winners', function(request, response) {
    var b = '<html><head><title>We Love Magic: the Gathering</title>'+util.randomStyle()+'</head><body>\n' +
	'<center><table><tr><td>' +
	'<HR><H2>Do Stuff</H2><HR>' + 
	'<a href="./start-draft">Start Draft</a><BR>' + 
	'<a href="./add-player">Add Player</a><BR>' + 
	'<a href="./add-format">Add Format</a><BR>' + 
	'<hr><h2>Look at Stuff</h2><hr>' + 
	'<a href="./all-players?order_by=rating+DESC">Players (by Rating)</a><BR>' + 
	'<a href="./all-players?order_by=money+DESC">Players (by Money)</a><BR>' + 
	'<a href="./all-players?order_by=latest_timestamp+DESC">Players (by Recent Activity)</a><BR>' + 
	'<a href="./all-players?order_by=name+ASC">Players (by Name)</a><BR>' + 
	'<a href="./all-players?order_by=id+DESC">Players (by Join Date)</a><BR>' + 
	'<a href="./all-players?order_by=ind_wins+DESC">Players (by Individual Wins)</a><BR>' + 
	'<a href="./all-players?order_by=ind_losses+DESC">Players (by Individual Losses)</a><BR>' + 
	'<a href="./all-players?order_by=draft_wins+DESC">Players (by Team Wins)</a><BR>' + 
	'<a href="./all-players?order_by=draft_losses+DESC">Players (by Team Losses)</a><BR>' + 
	'<a href="./add-player">All Matches</a><BR>' + 
	'<a href="./add-player">All Drafts</a><BR>' + 
	'<hr></table></body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();
});

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


players.setup(app);
drafts.setup(app);

console.log('Finished loading server');
