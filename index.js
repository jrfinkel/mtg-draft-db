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

app.get('/winners', function(request, response) {
    var b = '<html><head><title>We Love Magic: the Gathering</title>'+util.randomStyle()+'</head><body>\n' +
	'<center><table><tr><td>' +
	'Do Stuff<BR>' + 
	'<a href="./start-draft">Start a Draft</a><BR>' + 
	'<a href="./add-player">Add a Player</a><BR>' + 
	'Look at Stuff<BR>' + 
	'<a href="./all-players?order_by=rating+DESC">Players (by Rating)</a><BR>' + 
	'<a href="./all-players?order_by=money+DESC">Players (by Money)</a><BR>' + 
	'<a href="./all-players?order_by=latest_timestamp+DESC">Players (by Recent Activity)</a><BR>' + 
	'<a href="./all-players?order_by=name+ASC">Players (by Name)</a><BR>' + 
	'<a href="./all-players?order_by=id+DESC">Players (by Join Date)</a><BR>' + 
	'<a href="./all-players?order_by=ind_wins+DESC">Players (by Individual Wins)</a><BR>' + 
	'<a href="./all-players?order_by=ind_losses+DESC">Players (by Individual Losses)</a><BR>' + 
	'<a href="./all-players?order_by=draft_wins+DESC">Players (by Team Wins)</a><BR>' + 
	'<a href="./all-players?order_by=draft_losses+DESC">Players (by Losses)</a><BR>' + 
	'<a href="./add-player">All Matches</a><BR>' + 
	'<a href="./add-player">All Drafts</a><BR>' + 
	'</table></body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();

});

players.setup(app);
drafts.setup(app);

console.log('Finished loading server');
