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
    var notes = parseFloat(body['notes']);

    parseInt(body['win_pos']);

    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    client.query('INSERT INTO players_init (name, set_credit, rating, ind_wins, ind_losses, draft_wins, draft_ties, draft_losses, money, latest_timestamp, notes) VALUES (\''+ name +'\', '+ set_credit +', '+ rating +', '+ ind_wins + ', ' + ind_losses + ', ' + draft_wins + ', ' + draft_ties + ', ' + draft_losses + ', ' + money +', '+util.getTS()+', \''+notes+'\');');
    var query = client.query('INSERT INTO players SELECT * FROM players_init ORDER BY id DESC LIMIT 1;');

    query.on('end', function() { 
	client.end();
    });
}

function addPlayerPage (header, response) {

    var body = '<html><head><title>Add Player</title>\n' +
	util.randomStyle()+
    	'</head><body>' +
	'<center><table bgcolor=white><tr><td colspan=2 align=center><hr><h2><marquee>'+
	header+
	'</marquee></h2><hr>\n' +
	'<form name="the-form" action="/add-player" method="post">\n' +
	
	'<tr><td align=right>Name: <td align=left><input type="text" name="name" value="Loser McLoserstein"><br>\n' +
	'<tr><td align=right>Set Credit: <td align=left><input type="text" name="set_credit" value="0"><br>\n' +
	'<tr><td align=right>Rating: <td align=left><input type="text" name="rating" value="1600"><br>\n' +
	'<tr><td align=right>Individual Wins: <td align=left><input type="text" name="ind_wins" value="0"><br>\n' +
	'<tr><td align=right>Individual Losses: <td align=left><input type="text" name="ind_losses" value="0"><br>\n' +
	'<tr><td align=right>Draft Wins: <td align=left><input type="text" name="draft_wins" value="0"><br>\n' +
	'<tr><td align=right>Draft Ties: <td align=left><input type="text" name="draft_ties" value="0"><br>\n' +
	'<tr><td align=right>Draft Losses: <td align=left><input type="text" name="draft_losses" value="0"><br>\n' +
	'<tr><td align=right>Money Won/Lost: <td align=left><input type="text" name="money" value="0"><br>\n' +
	'<tr><td align=right>Notes: <td align=left><input type="text" name="notes" value=""><br>\n' +
	'<tr><td colspan=2 align=center><BR><input type="submit" value="Create Player"><input type="reset" value="Clear">' +
	'<hr></form></table></center></body></html>';	

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}


exports.setup = function setupHandlers (app) {
    app.get('/add-player', function(request, response) {
	addPlayerPage('Add Player', response);
    });

    app.post('/add-player', function(request, response) {
	util.readPostData(request, function(body) { 
	    insertPlayerInDB(body); 
	    addPlayerPage('Added <a href="./all-players">'+body['name']+'</a>. Add Another?', 
			  response);
	});
    });
}
