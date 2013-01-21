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

function syncQuery(psql_query, callback) {
    var res = new Array();

    console.log('About to query123 : ' + psql_query);

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	console.log('About to query: ' + psql_query);
	var query = client.query(psql_query);	
	query.on('row', function(row) { console.log('reading row'); res.push(row); });
	query.on('end', function(row) { callback(res); });
    });

    console.log('trying ... ' + psql_query);
}

function listPlayers(callback) {
    return syncQuery('SELECT * FROM players;', callback);
}

function listFormats(callback) {
    return syncQuery('SELECT * FROM formats ORDER BY id DESC;', callback);
}


function dropdown(name, data, idFn, valFn) {
    var body = '<select name="' + name + '">';
    data.forEach(function (row) {
	body += '<option value="'+idFn(row)+'">'+valFn(row)+'</optiion>'
    });
    body += '</select>';
    return body;
}

function playerDropdown(name, players) {
    return dropdown(name, players, function(row) { return row['id']; }, function(row) { return row['name'] + ' (' + row['id'] + ')'; });
}

function formatDropdown(formats) {
    return dropdown('format', formats, function(row) { return row['id']; }, function(row) { return row['format'] + ' (' + row['id'] + ')'; });
}

function startDraftPage (response) {
    console.log('starting startDraftPage');
    
    var ts = util.getTS();
    var body = '<html><head><title>Start a New Draft</title>\n' +
    	'</head><body><h1>New Draft</h1>' + 
	'<form name="the-form" action="/first-lineup" method="post">\n' +
	'<input type=hidden name="timestamp" value="'+ ts +'">Timestamp: '+ ts +'<br>\n';

    listFormats(function(formats) {
        body += 'Format: ' + formatDropdown(formats) + '<br>\n';
	listPlayers(function(players) {
	    players.unshift({'name':'No Player', 'id':-1});

	    body += '<h2>Team #1</h2>\n' +
		'Player: ' + playerDropdown('team1_player1', players) + '<br>\n' +
		'Player: ' + playerDropdown('team1_player2', players) + '<br>\n' +
		'Player: ' + playerDropdown('team1_player3', players) + '<br>\n' +
		'Player: ' + playerDropdown('team1_player4', players) + '<br>\n' +
		'Player: ' + playerDropdown('team1_player5', players) + '<br>\n';

	    body += '<h2>Team #2</h2>\n' +
		'Player: ' + playerDropdown('team2_player1', players) + '<br>\n' +
		'Player: ' + playerDropdown('team2_player2', players) + '<br>\n' +
		'Player: ' + playerDropdown('team2_player3', players) + '<br>\n' +
		'Player: ' + playerDropdown('team2_player4', players) + '<br>\n' +
		'Player: ' + playerDropdown('team2_player5', players) + '<br>\n';

	    body += '<br><input type=submit value="First Lineup ---&gt;&gt;"></form></body></html>';	
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(body);
	    response.end();

	});
    });
}

function firstLineup (body, response) {
    var team1Players = new Array();
    var team2Players = new Array();

    if (body['team1_player1'] != -1) { team1Players.push(body['team1_player1']); }
    if (body['team1_player2'] != -1) { team1Players.push(body['team1_player2']); }
    if (body['team1_player3'] != -1) { team1Players.push(body['team1_player3']); }
    if (body['team1_player4'] != -1) { team1Players.push(body['team1_player4']); }
    if (body['team1_player5'] != -1) { team1Players.push(body['team1_player5']); }

    if (body['team2_player1'] != -1) { team2Players.push(body['team2_player1']); }
    if (body['team2_player2'] != -1) { team2Players.push(body['team2_player2']); }
    if (body['team2_player3'] != -1) { team2Players.push(body['team2_player3']); }
    if (body['team2_player4'] != -1) { team2Players.push(body['team2_player4']); }
    if (body['team2_player5'] != -1) { team2Players.push(body['team2_player5']); }

    var psql1 = 'SELECT * FROM players WHERE id IN (';
    var first = true;
    team1Players.forEach(function (id) { if (!first) { psql1 += ', '; } 
					 first = false; 
					 psql1 += id; });
    psql1 += ');';

    var psql2 = 'SELECT * FROM players WHERE id IN (';
    first = true;
    team2Players.forEach(function (id) { if (!first) { psql2 += ', '; } 
					 first = false; 
					 psql2 += id; });
    psql2 += ');';

    syncQuery(psql1, function(players1) {
	players1.unshift({'name':'No Player', 'id':-1});
	syncQuery(psql2, function(players2) {
	    players2.unshift({'name':'No Player', 'id':-1});
	    
	    var b = '<html><head><title>First Lineup</title>\n' +
    		'</head><body><h1>Firest Lineup</h1>' + 
		'<form name="the-form" action="/second-lineup" method="post">\n' +
		'1. ' + playerDropdown('player11', players1) + '  ' + playerDropdown('player12', players2) + '<br>/n' +
		'2. ' + playerDropdown('player21', players1) + '  ' + playerDropdown('player22', players2) + '<br>/n' +
		'3. ' + playerDropdown('player31', players1) + '  ' + playerDropdown('player32', players2) + '<br>/n' +
		'4. ' + playerDropdown('player41', players1) + '  ' + playerDropdown('player42', players2) + '<br>/n' +
		'5. ' + playerDropdown('player51', players1) + '  ' + playerDropdown('player52', players2) + '<br>/n' +
		'<br><input type=submit value="Second Lineup ---&gt;&gt;"></form></body></html>';	

	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(b);
	    response.end();    
	});
    });

 
}

exports.setup = function setupHandlers (app) {

    app.get('/start-draft', function(request, response) {
	console.log('GET: start-draft');
	startDraftPage(response);
    });

    app.post('/first-lineup', function(request, response) {
	console.log('POST: first-lineup');
	util.readPostData(request, function(body) { 
	    firstLineup(body, response);
	});
    });
}
