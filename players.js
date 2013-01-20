var pg = require('pg');

var util = require('./util');

exports.setup = function setupHandlers (app) {
    app.get('/all-players', function(request, response) {
	//allPlayers(response);
    });

    app.get('/player', function(request, response) {
	//playerInfo(response);
    });

    app.get('/add-player', function(request, response) {
	addPlayer(response);
    });

    app.post('/add-player', function(request, response) {
	//console.log('Serving up request for interesting-facts');
    
//	util.readPostData(request, 
//		     function (bodyJSON) 
//		     { handler(request, response, bodyJSON); });
    });

}

function addPlayer (response) {

    var body = '<html><head><title>Add Player</title>\n' +
    	'</head><body><t1>Add Player</t1>\n' +
	'<form name="the-form" action="/add-player" method="post">\n' +
	'Name: <input type="text" name="name" value="Loser McLoserstein"><br>\n' +
	'Set Credit: <input type="text" name="set_credit" value="-1"><br>\n' +
	'Personal Wins: <input type="text" name="ind_wins" value="0"><br>\n' +
	'Personal Losses: <input type="text" name="ind_losses" value="0"><br>\n' +
	'Draft Wins: <input type="text" name="draft_wins" value="0"><br>\n' +
	'Draft Ties: <input type="text" name="draft_ties" value="0"><br>\n' +
	'Draft Losses: <input type="text" name="draft_losses" value="0"><br>\n' +
	'Money Won/Lost: <input type="text" name="money" value="0"><br>\n' +
	'</form>' +
	'</body></html>
	

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}
