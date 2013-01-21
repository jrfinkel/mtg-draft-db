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
    console.log('starting startDraftPge');

    var body = '<html><head><title>Start a New Draft</title>\n' +
    	'</head><body><h1>New Draft</h1><form>';

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

	    body += '<br><input type=submit value="First Line-up --->>"></form></body></html>';	
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(body);
	    response.end();

	});
    });
}

exports.setup = function setupHandlers (app) {

    app.get('/start-draft', function(request, response) {
	console.log('start-draft');
	startDraftPage(response);
    });
}
