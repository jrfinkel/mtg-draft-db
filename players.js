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

function allPlayers (response, order_by) {
    var body = '<html><head>\n'+
	'<title>All Players</title>\n' +
	util.randomColoredStyle(true)+
    	'</head><body>\n' +
	playerTableHeader();

    response.writeHead(200, {"Content-Type": "text/html"});

    displayPlayers('SELECT *, TO_TIMESTAMP(latest_timestamp) AS latest_timestamp_utc, ROUND(rating::numeric,2) AS the_rating FROM players ORDER BY '+order_by+';',
			function rowFn (row) {
			    body += playerRowFn(row); },
			function endFn () { 
			    body += '</table></body></html>\n';	
			    response.write(body);
			    response.end(); });
}


function playerRowFn(row) {
    return '<tr>'+
	'<td>'+row['id']+'</td>\n' +
	'<td>'+row['name']+'</td>\n' +
	'<td>'+row['set_credit']+'</td>\n' +
	'<td>'+row['the_rating']+'</td>\n' +
	'<td>'+row['ind_wins']+'</td>\n' +
	'<td>'+row['ind_losses']+'</td>\n' +
	'<td>'+row['draft_wins']+'</td>\n' +
	'<td>'+row['draft_ties']+'</td>\n' +
	'<td>'+row['draft_losses']+'</td>\n' +
	'<td>'+row['money']+'</td>\n' +
	'<td>'+row['latest_timestamp_utc']+'</td></tr>\n';

}

function playerTableHeader() {
    return '<table cellpadding="5" cellspacing="0" border="5"><tr><th>ID<th>Name<th>Set Credit<th>Rating<th>Individual Wins<th>Individual Losses<th>Team Wins<th>Team Ties<th>Team Losses<th>Money<TH>Latest Timestamp</tr>' ;
}

function displayPlayers(querySQL, rowCallback, endCallback) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query(querySQL);
	query.on('row', function(row) { rowCallback(row); });
	query.on('end', function() { endCallback(); });
    });
}

function playerInfo(request, response) {
    var playerId = qp['id'];

    var qp = util.readGetData(request);
    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query('SELECT *, TO_TIMESTAMP(latest_timestamp) AS latest_timestamp_utc FROM players WHERE id = '+playerId);
	var player;
	query.on('row', function(row) { player = row; });
	query.on('end', function() { 

	    var body = JSON.stringify(player);

	    var query = client.query('SELECT *, FROM matches WHERE winner_id = '+playerId+' OR loser_id = '+playerId+';');

	    body += JSON.stringify;
	    body = '[' + body + ']';

	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(body);
	    response.end();
	});
    });
}

exports.setup = function setupHandlers (app) {
    app.get('/all-players', function(request, response) {
	if (request.query.order_by) {
	    allPlayers(response, unescape(request.query.order_by));
	} else {
	    allPlayers(response, 'latest_timestamp DESC');
	}
    });

    app.get('/player', function(request, response) {
	playerInfo(request, response);
    });

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
