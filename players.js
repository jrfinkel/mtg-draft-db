var pg = require('pg');

var util = require('./util');

function insertPlayerInDB(body) {
    console.log('adding player to db');

    var name = body['name'];
    var set_credit = parseInt(body['set_credit']);
    var rating = parseInt(body['rating']);
    var ind_wins = parseInt(body['ind_wins']);
    var ind_losses = parseInt(body['ind_losses']);
    var draft_wins = parseInt(body['draft_wins']);
    var draft_ties = parseInt(body['draft_ties']);
    var draft_losses = parseInt(body['draft_losses']);
    var money = parseFloat(body['money']);

    parseInt(body['win_pos']);

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var q = 'INSERT INTO players (name, set_credit, rating, ind_wins, ind_losses, draft_wins, draft_ties, draft_losses, money) VALUES (\''+ name +'\', '+ set_credit +', '+ rating +', '+ ind_wins + ', ' + ind_losses + ', ' + draft_wins + ', ' + draft_ties + ', ' + draft_losses + ', ' + money +');';
	console.log('About to query: ' + q);
	var query = client.query(q);	
	query.on('row', function(row) { console.log('Added new player: '+row); });
	query.on('end', function(row) { console.log('Finished adding player: '+name); });
    });
}

var addPlayerForm = '<t1>Add Player</t1>\n' +
    '<form name="the-form" action="/add-player" method="post">\n' +
    'Name: <input type="text" name="name" value="Loser McLoserstein"><br>\n' +
    'Set Credit: <input type="text" name="set_credit" value="-1"><br>\n' +
    'Rating: <input type="text" name="rating" value="0"><br>\n' +
    'Personal Wins: <input type="text" name="ind_wins" value="0"><br>\n' +
    'Personal Losses: <input type="text" name="ind_losses" value="0"><br>\n' +
    'Draft Wins: <input type="text" name="draft_wins" value="0"><br>\n' +
    'Draft Ties: <input type="text" name="draft_ties" value="0"><br>\n' +
    'Draft Losses: <input type="text" name="draft_losses" value="0"><br>\n' +
    'Money Won/Lost: <input type="text" name="money" value="0"><br>\n' +
    '<input type="submit" name="Create Player"><input type="reset" name="Clear">' +
    '</form>';

function addPlayerPage (header, response) {

    var body = '<html><head><title>Add Player</title>\n' +
    	'</head><body>' +
	header +
	addPlayerForm +
	'</body></html>';
	

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

exports.setup = function setupHandlers (app) {
    app.get('/all-players', function(request, response) {
	//allPlayers(response);
    });

    app.get('/player', function(request, response) {
	//playerInfo(response);
    });

    app.get('/add-player', function(request, response) {
	addPlayerPage('', response);
    });

    app.post('/add-player', function(request, response) {
	util.readPostData(request, function(body) { 
	    insertPlayerInDB(body); 
	    addPlayerPage('<h3> Added player row for '+body['name']+'.</h3>', 
			  response);
	});
    });
}
