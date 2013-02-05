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
    return syncQuery('SELECT * FROM players ORDER BY latest_timestamp DESC;', callback);
}

function listFormats(callback) {
    return syncQuery('SELECT * FROM formats ORDER BY id DESC;', callback);
}

function dropdown(name, data, idFn, valFn, selectIdx) {
    var body = '<select name="' + name + '">';
    var i = 0;
    data.forEach(function (row) {
	body += '<option value="'+idFn(row)+'"';
	if (i == selectIdx) { body += ' selected'; }
	body +='>'+valFn(row)+'</option>';
	i++;
    });
    body += '</select>';

    return body;
}

function playerDropdown(name, players, selectIdx) {
    return dropdown(name, players, function(row) { return row['id']; }, function(row) { return row['name'] + ' (' + row['id'] + ')' ; }, selectIdx);
}

function formatDropdown(formats) {
    return dropdown('format', formats, function(row) { return row['id']; }, function(row) { return row['format'] + ' (' + row['id'] + ')'; }, 0);
}

function startDraftPage (response) {
    console.log('starting startDraftPage');
    
    var body = '<html><head><title>Start a New Draft</title>\n' +
	util.randomStyle() +
    	'</head><body><form name="the-form" action="/first-lineup" method="post">\n' +
	'<table align=center><tr><td colspan=2 align=center><h1>New Draft</h1>';

    listFormats(function(formats) {
        body += formatDropdown(formats) + '\n';
	listPlayers(function(players) {
	    players.unshift({'name':'No Player', 'id':-1});

	    body += '<br><br><tr><th><h2>Team #1<th><h2>Team #2';
	    for (var i=0; i<5; i++) {
		body += '<tr>';
		for (var j=0; j<2; j++) {
		    body += '<td>' + playerDropdown('team'+j+'_player'+i, players, 0) + '<br>\n';
		}
	    }
	    body += '<tr><td colspan=2 align=center><br><input type=submit value="First Round ---&gt;&gt;"><br></table></form></body></html>';	
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
	util.randomStyle() +
    	'</head><body>'+
	'<form name="the-form" action="/'+action+'" method="post"><center>' +
	'<input type=hidden name="data" value="'+ dataStr +'">\n<table>\n' +	
	'<tr><td align=center colspan=3><h1>'+round+' Round </h1>\n'; 


    for (var i = 0; i < numLineups; i++) {
	b += '<tr><td>'+ playerDropdown('player'+i+'0', teams[0], i+1) + ' <td><input type="radio" name="win'+i+'" value="0" checked="checked"> vs <input type="radio" name="win'+i+'" value="1"> <td>' + playerDropdown('player'+i+'1', teams[1], 0) + '\n';
    }

    b += '<tr><td colspan=3 align=center><BR><input type=submit value="'+nextStep+' ---&gt;&gt;"><BR></table></form></body></html>';	

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
	var teamPlayers = [];
	for (var p=0; p<5; p++) {
	    var playerId = body['team'+team+'_player'+p];
	    if (playerId != -1) { teamPlayers.push(playerId); }
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

   syncQuery(playerQuery(teams[0]), function(players0) {
	syncQuery(playerQuery(teams[1]), function(players1) {
	    var outTeams = [[], []];
	    var t = 0;
	    [players0, players1].forEach(function(team) {
		team.forEach(function (p) {
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

    winnerRating += k * winnerOdds;
    loserRating -= k * winnerOdds;

    return [winnerRating, loserRating];
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

function finalStep (body, response) {

    var data = JSON.parse(unescape(body['data']));
    var results = readWinners(body, data['results']);
    var winner = -1;

    if (results['team'][0] > results['team'][1]) {
	winner = 0;
    } else if (results['team'][0] < results['team'][1]) {
	winner = 1;
    }

    makeDraftEntries(data['format'], data['teams'], function(draftEntry) {
	data.teams = draftEntry.teams;

	var b = '<html><head><title>Final Confirmation</title>' +
	    util.randomStyle() +    
	    '</head><body><form name="the-form" action="/confirm" method="post"><center><table>\n';
	if (winner == -1) {
	    b += '<tr><td align=center colspan=3><hr><marquee><h2>It\'s a tie!</h2></marquee><hr>';
	}

	var playerMap = {};
	var playerNum = 0;

	for (var i=0; i<2; i++) {
	    var money = 20;
	    var winDiff = 0, loseDiff = 0, tieDiff = 0;
	    if (winner == i) {
		b += '<tr><td align=center colspan=3><hr><h2><marquee>Winners</marquee></h2><hr>';
		money = 20;
		winDiff++;
	    } else if (winner == -1) {
		money = 0;
		tieDiff++;
	    } else {
		b += '<tr><td align=center colspan=3><hr><marquee><h2>Losers</h2></marquee><hr>';
		money = -20;
		loseDiff++;
	    }
	    
	    if (i == 0 || winner != -1) {
		b += '\n<tr><th><th>$$<th>SC\n';
	    }
	    data.teams[i].forEach(function(player) {
		b += '<tr><td align="center">'+player.name+'<td align="center"><input type="hidden" name="player'+playerNum+'" value='+player.id+'><input type="text" name="money'+playerNum+'" value="'+money+'" size="3"><td><input type="text" name="set_credit'+playerNum+'" value="-1" size="3">';
		playerNum++;

		player.draft_wins += winDiff;
		player.draft_losses += loseDiff;
		player.draft_ties += tieDiff;

		playerMap[player.id] = player;
	    });
	}

	
	var newData = {'results':data['results'], 
		       'players':playerMap, 
		       'draft_id':draftEntry.id}

	b += '<tr><td align=center colspan=3><input type="hidden" name="data" value="'+escape(JSON.stringify(newData))+'">';
	b += '<br><input type=submit value="Confirm &amp; Save"></table></form></body></html>';
  
	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(b);
	response.end();    
    });
} 

function processMatch (draft_id, winningPlayer, losingPlayer) {

    var r = newRatings(winningPlayer.rating, losingPlayer.rating);
    winningPlayer.rating = r[0];
    winningPlayer.ind_wins++;
    losingPlayer.rating = r[1];
    losingPlayer.ind_losses++;

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var q = 'INSERT INTO matches (timestamp, draft_id, winner_id, winner_team_id, winner_end_rating, loser_id, loser_team_id, loser_end_rating) VALUES ('+util.getTS()+', '+draft_id+', '+winningPlayer.id+', '+winningPlayer.team_id+', '+r[0]+', '+losingPlayer.id+', '+losingPlayer.team_id+', '+r[1]+');';
	console.log('About to query: ' + q);
	client.query(q);	
    });

}

function confirmedStep (body, response) {

    var data = JSON.parse(unescape(body['data']));

    var b = '<html><head>'+util.randomStyle()+'</head><body>';

     for (var i=0; i<10; i++) {
	if (body['player'+i]) {
	    var player_id = parseInt(body['player'+i]);
	    ['money', 'set_credit'].forEach(function(s) {
		var v = parseFloat(body[s+i]);
		data.players[player_id][s] += v;
	    });
	} else {
	    break;
	}
    }

    data.results.player.forEach(function(p) {
	var winner = p[0];
	var loser = p[1];

	b += JSON.stringify(data.players[winner])+'<BR>';
	b += JSON.stringify(data.players[loser])+'<BR>';
	processMatch(data['draft_id'], data.players[winner], data.players[loser]);
	b += JSON.stringify(data.players[winner])+'<BR>';
	b += JSON.stringify(data.players[loser])+'<BR><BR><HR><BR>';
	
    });


    var client = new pg.Client(process.env.DATABASE_URL);
    client.connect();
    var query;
    Object.keys(data.players).forEach(function(id) {
	var player = data.players[id];
	console.log('PLAYER: ' + JSON.stringify(player));
	var q = 'UPDATE players SET (set_credit, rating, ind_wins, ind_losses, draft_wins, draft_ties, draft_losses, money, latest_timestamp) = ('+ player.set_credit+', '+player.rating +', '+ player.ind_wins + ', ' + player.ind_losses + ', ' + player.draft_wins + ', ' + player.draft_ties + ', ' + player.draft_losses + ', ' + player.money +', '+util.getTS()+ ') WHERE id = '+id+';';
	console.log('About to query: ' + q);
	query = client.query(q);
    });

    query.on('end', function() { 
     	client.end();
    });

    b += '</body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();    
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

    app.post('/confirm', function(request, response) {
	console.log('POST: confirm');
	util.readPostData(request, function(body) { 
	    confirmedStep(body, response);
	});
    });
}
