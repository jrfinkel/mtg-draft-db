var pg = require('pg');
var util = require('./util');




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
	body += '<option value="'+idFn(row)+'">'+valFn(row)+'</option>'
    });
    body += '</select>';

    return body;
}

function playerDropdown(name, players) {
    return dropdown(name, players, function(row) { return row['id']; }, function(row) { return row['name'] + ' (' + row['id'] + ')' ; });
}

function formatDropdown(formats) {
    return dropdown('format', formats, function(row) { return row['id']; }, function(row) { return row['format'] + ' (' + row['id'] + ')'; });
}

function startDraftPage (response) {
    console.log('starting startDraftPage');
    
    var body = '<html><head><title>Start a New Draft</title>\n' +
    	'</head><body><h1>New Draft</h1>' + 
	'<form name="the-form" action="/first-lineup" method="post">\n' +
	'<input type=hidden name="timestamp" value="'+ ts +'">\n';

    listFormats(function(formats) {
        body += 'Format: ' + formatDropdown(formats) + '<br>\n';
	listPlayers(function(players) {
	    players.unshift({'name':'No Player', 'id':-1});

	    body += '<br><br><table><tr><th colspan=2>Team #1<th colspan=2>Team #2' +
		'<tr><th>Set Credit<th>Player<th>Set Credit<th>Player';
	    for (var i=0; i<5; i++) {
		body += '<tr>';
		for (var j=0; j<2; j++) {
		    body += '<td align="center"><input type="text" size="3" name="team'+j+'_player'+i+'_set_credit" value="-1">' +
			'<td>' + playerDropdown('team'+j+'_player'+i, players) + '<br>\n';
		}
	    }
	    body += '</table><br><input type=submit value="First Round ---&gt;&gt;"></form></body></html>';	
	    response.writeHead(200, {"Content-Type": "text/html"});
	    response.write(body);
	    response.end();

	});
    });
}

function displayLineup(teams, data, round, nextStep, action, response) {
    var numLineups = Math.max(Object.keys(teams[0]).length, Object.keys(teams[1]).length);

    var dataStr = escape(JSON.stringify(data));

    for (var i=0; i<2; i++) {
	teams[i].unshift({'name':'No Player', 'id':-1});
    }	 

    var b = '<html><head><title>'+round+' Round</title>\n' +
    	'</head><body><h1>'+round+' Round </h1>' + 
	'<form name="the-form" action="/'+action+'" method="post">\n' +
	'<input type=hidden name="data" value="'+ dataStr +'">\n' +
	'<h3>Please select the competitors and the winner of each match.</h3>\n<table><tr><th><th>Team 1<th><th>Team 2<th>\n';

    for (var i = 0; i < numLineups; i++) {
	b += '<tr><td>'+ i +'. <td>' + playerDropdown('player'+i+'0', teams[0]) + ' <td><input type="radio" name="win'+i+'" value="0" checked="checked"> vs <input type="radio" name="win'+i+'" value="1"> <td>' + playerDropdown('player'+i+'1', teams[1]) + '\n';
    }

    b += '</table><br><input type=submit value="'+nextStep+' ---&gt;&gt;"></form></body></html>';	

    for (var i=0; i<2; i++) {
	teams[i].shift();
    }

//    b = '<html><body>' + JSON.stringify(teams[0]) + '<BR><BR>' + JSON.stringify(teams[1]) + '</body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();    
}

function playerQuery(ids) {
    var psql = 'SELECT * FROM players WHERE id IN (';
    var first = true;
    ids.forEach(function (id) { if (!first) { psql += ', '; } 
				first = false; 
				psql += id; });
    psql += ');';
    return psql;
}

function readTeams(body) {
    var teams = [];

    for (var team=0; team<2; team++) {
	var teamPlayers = {};
	for (var p=0; p<5; p++) {
	    var playerId = body['team'+team+'_player'+p];
	    var playerSetCredit = body['team'+team+'_player'+p+'_set_credit'];
	    if (playerId != -1) { teamPlayers[playerId] = playerSetCredit; }
	}
	teams.push(teamPlayers);
    }

    return teams;
}

function readWinners (body, result) {

    for (var i=0; i<5; i++) {
	team0Player = body['player'+i+'0'];
	team1Player = body['player'+i+'1'];
	if (team0Player && team1Player && team0Player != -1 && team1Player != -1) {
	    winningTeam = body['win'+i];
	    console.log("WINNING TEAM "+ i + " " +winningTeam);
	    result['team'][winningTeam]++; // = teamResult[winningTeam] + 1;
	    if (winningTeam == 0) {
		result['player'].push([team0Player, team1Player]);
	    } else {
		result['player'].push([team1Player, team0Player]);
	    }
	}
    }

    return result;
}

function firstLineup (body, response) {
    var teams = readTeams(body);    

   syncQuery(playerQuery(Object.keys(teams[0])), function(players0) {
	syncQuery(playerQuery(Object.keys(teams[1])), function(players1) {
	    var outTeams = [[], []];
	    var t = 0;
	    [players0, players1].forEach(function(team) {
		team.forEach(function (p) {
		    var pid = p['id'];
		    var setCredit = teams[t][pid];
		    p['draft_set_credit'] = setCredit;
		    outTeams[t].push(p);
		});
		t++;
	    });
	    displayLineup(outTeams, {'teams':outTeams, 'format':body['format']}, 'First', 'Second Round', 'second-lineup', response);
	});
    }); 

}

function secondLineup (body, response) {
    var data = JSON.parse(unescape(body['data']));
    data['results'] = {};
    data['results']['team'] = [0, 0];
    data['results']['player'] = [];

    data['results'] = readWinners(body, data['results']);

    displayLineup(data['teams'], data, 'Second', 'Third Round', 'third-lineup', response);
}

function thirdLineup (body, response) {
    var data = JSON.parse(unescape(body['data']));
    data['results'] = readWinners(body, data['results']);

    displayLineup(data['teams'], data, 'Third', 'Draft Summary', 'final-step', response);
}

function newRatings (winnerRating, loserRating) {
    var k = 20;
    
    var winnerOdds = 1 / (1 + Math.pow(10, ((winnerRating - loserRating) / 400)))

    winnerRank += k * winnerOdds;
    loserRank -= k * winnerOdds;

    return [winnerRank, loserRank];
}

function makeTeamEntry (client, draft_id, team_id, team) {
    team.forEach(function(player) {
	console.log("TEAM ENTRY: "+draft_id+" "+team_id+" "+player.id);
	client.query('INSERT INTO draft_teams (draft_id, team_id, player_id) VALUES ('+draft_id+', '+team_id+', '+player.id+');');
    });
}

function makeDraftEntries (format, teams, callback) {

    var ts = util.getTS();

    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    
    client.query('INSERT INTO drafts (timestamp, format) VALUES (' + ts + ', ' + format +');');	
    var entry;
    var query = client.query('SELECT * FROM drafts ORDER BY id DESC LIMIT 1', function(err, result) {
	entry = result.rows[0];
	console.log("INSIDE QUERY: "+JSON.stringify(entry));
	makeTeamEntry(client, result.rows[0].id, result.rows[0].team0_id, teams[0]);
	makeTeamEntry(client, result.rows[0].id, result.rows[0].team1_id, teams[1]);
	var teamIds = [result.rows[0].team0_id, result.rows[0].team1_id]

	for (var i=0; i<2; i++) {
	    teams[i].forEach(function(player) {
		player['team_id'] = teamIds[i];
	    });
	}

	entry.teams = teams;
	callback(entry);

	console.log("NEW TEAMS: "+JSON.stringify(teams));
    });
}

function processMatch (winningPlayer, losingPlayer) {
    var newRatings = newRatings(winningPlayer.rating, losingPlayer.rating);
    winningPlayer.rating = newRatings[0];
    losingPlayer.rating = newRatings[1];
}

function finalStep (body, response) {

    var data = JSON.parse(unescape(body['data']));
    var results = readWinners(body, data['results']);

    var winnerString = '';
    var winner = -1;
    if (results['team'][0] > results['team'][1]) {
	winnerString = "Winner is Team 1!";
	winner = 0;
    } else if (results['team'][0] < results['team'][1]) {
	winnerString = "Winner is Team 2!";
	winner = 1;
    } else {
	winnerString = "It's a tie!";
	winner = -1;
    }

    makeDraftEntries(data['format'], data['teams'], function(draftEntry) {
	data.teams = draftEntry.teams;

	var b = '<html><head><title>Final Confirmation</title></head><body><form name="the-form" action="confirm" method="post">\n';
	b += '<h1>'+winnerString+'</h1>';

	for (var i=0; i<2; i++) {
	    var money = 20;
	    if (winner == i) {
		b += '<h2>Winning Team</h2>';
		money = 20;
	    } else if (winner == -1) {
		b += '<h2>Tied Team</h2>';
		money = 0;
	    } else {
		b += '<h2>Losing Team</h2>';
		money = -20;
	    }
	    b += '\n<table><tr><th>id<th>name<th>money won/lost\n';

	    var playerNum = 0;
	    data.teams[i].forEach(function(player) {
		b += '<tr><td align="center">'+player.id+'<td align="center">'+player.name+'<td align="center"><input type="hidden" name="player'+i+''+playerNum+'"><input type="text" name="money'+i+''+playerNum+'" value="'+money+'" size="3">';
		playerNum++;
	    });
	    b += '</table>';
	}

//	b += JSON.stringify(data);
	b += '<input type=submit value="Confirm"></form></body></html>';
  
	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(b);
	response.end();    
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

    app.post('/second-lineup', function(request, response) {
	console.log('POST: second-lineup');
	util.readPostData(request, function(body) { 
	    secondLineup(body, response);
	});
    });

    app.post('/third-lineup', function(request, response) {
	console.log('POST: third-lineup');
	util.readPostData(request, function(body) { 
	    thirdLineup(body, response);
	});
    });

    app.post('/final-step', function(request, response) {
	console.log('POST: final-step');
	util.readPostData(request, function(body) { 
	    finalStep(body, response);
	});
    });
}
