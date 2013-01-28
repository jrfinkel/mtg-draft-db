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

function displayLineup(teams, data, round, nextStep, response) {
    var numLineups = Math.max(teams[0].length, teams[1].length);

    var dataStr = escape(JSON.stringify(data));

    for (var i=0; i<2; i++) {
	teams[i].unshift({'name':'No Player', 'id':-1});
    }	 

    var b = '<html><head><title>'+round+' Round</title>\n' +
    	'</head><body><h1>'+round+' Round</h1>' + 
	'<form name="the-form" action="/second-lineup" method="post">\n' +
	'<input type=hidden name="data" value="'+ dataStr +'">\n' +
	'<h3>Please select the competitors and the winner of each match.</h3>\n<table><tr><th><th>Team 1<th><th>Team 2<th>\n';

    for (var i = 0; i < numLineups; i++) {
	b += '<tr><td>'+ i +'. <td>' + playerDropdown('player'+i+'0', teams[0]) + ' <td><input type="radio" name="win'+i+'" value="team0" checked="checked"> vs <input type="radio" name="win'+i+'" value="team1"> <td>' + playerDropdown('player'+i+'1', teams[1]) + '\n';
    }

    b += '</table><br><input type=submit value="'+nextStep+' ---&gt;&gt;"></form></body></html>';	

    for (var i=0; i<2; i++) {
	teams[i].shift();
    }

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

function readWinners (body) {
    return {'winners':'blarg'};
}

function firstLineup (body, response) {
    var teams = readTeams(body);    
/**
    b = '<html><body>'+JSON.stringify(teams)+'<BR><BR>'+JSON.stringify(body)+'</body></html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(b);
    response.end();    
*/
    syncQuery(playerQuery(teams[0].keys), function(players0) {
	syncQuery(playerQuery(teams[1].keys), function(players1) {
	    ts = [players0, players1];
	    for (var t=0; t<2; t++) {
		players = ts[t];
		players.forEach(function (p) {
		    var setCredit = teams[t][p['id']];
		    p['id']['draft_set_credit'] = setCredit;
		    teams[t]['id'] = p;
		});}
	    displayLineup(teams, {"teams":teams}, 'First', 'Second Round', response);
	});
    });
}

function secondLineup (body, response) {
    var data = JSON.parse(unescape(body['data']));
    var winners = readWinners(body);
    data['rounds'][0] = winners;

    displayLineup(data['teams'], data, 'Second', 'Third Round', response);
}

function secondLineup (body, response) {
    var data = JSON.parse(unescape(body['data']));
    var winners = readWinners(body);
    data['rounds'][1] = winners;

    displayLineup(data['teams'], data, 'Second', 'Third Round', response);
}

function finalStep (body, response) {

    var data = JSON.parse(unescape(body['data']));
    var winners = readWinners(body);
    data['rounds'][1] = winners;

    var b = '<html><head><title>Final Confirmation</title>\n' +
    	'</head><body><h1>finalConfirmation</h1>' + 
	JSON.stringify(body) + '<br></table></body></html>';
    
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

    app.post('/final-step', function(request, response) {
	console.log('POST: final-step');
	util.readPostData(request, function(body) { 
	    finalStep(body, response);
	});
    });
}
