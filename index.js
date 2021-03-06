var express = require('express');
var connect = require('connect');

var players = require('./players');
var drafts = require('./drafts');
var formats = require('./formats');
var stats = require('./stats');
var util = require('./util');


console.log('Starting server.');

var username = 'draft';
var password = 'database';

var app = express();

app.use(express.logger());

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

app.get('/winners', function(request, response) {
    var b = '<html><head><title>We Love Magic: the Gathering</title>'+util.randomStyle()+'</head><body>\n' +
	'<center><table><tr><td>' +
	'<HR><H2>Do Stuff</H2><HR>' + 
	'<a href="./start-draft">Start Draft</a><BR>' + 
	'<a href="./add-player">Add Player</a><BR>' + 
	'<a href="./add-format">Add Format</a><BR>' + 
	'<hr><h2>Look at Stuff</h2><hr>' + 
	'<a href="./all-drafts">All Drafts</a><BR>' + 
	'<a href="./all-players?order_by=rating+DESC">Players (by Rating)</a><BR>' + 
	'<a href="./all-players?order_by=money+DESC">Players (by Money)</a><BR>' + 
	'<a href="./all-players?order_by=latest_timestamp+DESC">Players (by Recent Activity)</a><BR>' + 
	'<a href="./all-players?order_by=name+ASC">Players (by Name)</a><BR>' + 
	'<a href="./all-players?order_by=id+DESC">Players (by Join Date)</a><BR>' + 
	'<a href="./all-players?order_by=ind_wins+DESC">Players (by Individual Wins)</a><BR>' + 
	'<a href="./all-players?order_by=ind_losses+DESC">Players (by Individual Losses)</a><BR>' + 
	'<a href="./all-players?order_by=draft_wins+DESC">Players (by Team Wins)</a><BR>' + 
	'<a href="./all-players?order_by=draft_losses+DESC">Players (by Team Losses)</a><BR>' + 
	'<hr></table></body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();
});


var basicAuth = connect.basicAuth(username, password);

players.setup(app, basicAuth);
drafts.setup(app, basicAuth);
stats.setup(app);
formats.setup(app, basicAuth);

console.log('Finished loading server');
