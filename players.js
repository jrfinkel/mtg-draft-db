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

    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    client.query('INSERT INTO players_init (name, set_credit, rating, ind_wins, ind_losses, draft_wins, draft_ties, draft_losses, money, latest_timestamp) VALUES (\''+ name +'\', '+ set_credit +', '+ rating +', '+ ind_wins + ', ' + ind_losses + ', ' + draft_wins + ', ' + draft_ties + ', ' + draft_losses + ', ' + money +', '+util.getTS()+');');
    var query = client.query('INSERT INTO players SELECT * FROM players_init ORDER BY id DESC LIMIT 1;');

    query.on('end', function() { 
	client.end();
    });
}

var addPlayerForm = '<h2>Add New Player:</h2>\n' +
    '<form name="the-form" action="/add-player" method="post">\n' +
    'Name: <input type="text" name="name" value="Loser McLoserstein"><br>\n' +
    'Set Credit: <input type="text" name="set_credit" value="-1"><br>\n' +
    'Rating: <input type="text" name="rating" value="1600"><br>\n' +
    'Individual Wins: <input type="text" name="ind_wins" value="0"><br>\n' +
    'Individual Losses: <input type="text" name="ind_losses" value="0"><br>\n' +
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

function allPlayers (response) {
    var body = '<html><head>\n'+
	'<title>All Players</title>\n' +
    	'</head><body>\n' +
	playerTableHeader();

    response.writeHead(200, {"Content-Type": "text/html"});

    displayPlayers('SELECT * FROM players ORDER BY latest_timestamp DESC;', 
			function rowFn (row) {
			    console.log('hi there');
			    body += playerRowFn(row); },
			function endFn () { 
			    console.log('good-bye');
			    body += '</table></body></html>\n';	
			    response.write(body);
			    response.end(); });
}


function playerRowFn(row) {
    return '<tr>'+
	'<td>'+row['id']+'</td>\n' +
	'<td>'+row['name']+'</td>\n' +
	'<td>'+row['set_credit']+'</td>\n' +
	'<td>'+row['rating']+'</td>\n' +
	'<td>'+row['ind_wins']+'</td>\n' +
	'<td>'+row['ind_losses']+'</td>\n' +
	'<td>'+row['draft_wins']+'</td>\n' +
	'<td>'+row['draft_ties']+'</td>\n' +
	'<td>'+row['draft_losses']+'</td>\n' +
	'<td>'+row['money']+'</td></tr>\n' +
	'<td>'+row['latest_timestamp']+'</td></tr>\n';

}

function playerTableHeader() {
    return '<table cellpadding="5" cellspacing="0" border="5"><tr><th>ID<th>Name<th>Set Credit<th>Rating<th>Individual Wins<th>Individual Losses<th>Team Wins<th>Team Ties<th>Team Losses<th>Money<TH>Latest Timestamp</tr>' ;
}

function displayPlayers(querySQL, rowCallback, endCallback) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query(querySQL);
	query.on('row', function(row) { console.log(row); rowCallback(row); });
	query.on('end', function() { console.log("end"); endCallback(); });
    });
}


exports.setup = function setupHandlers (app) {
    app.get('/all-players', function(request, response) {
	allPlayers(response);
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
	    addPlayerPage('<h3> Added player row for '+body['name']+'. <a href="./all-players">All Players</a></h3>', 
			  response);
	});
    });
}
