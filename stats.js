var pg = require('pg');
var util = require('./util');

function allPlayers (response, order_by) {
    var body = '<html><head>\n'+
	'<title>All Players</title>\n' +
	util.randomColoredStyle(true)+
    	'</head><body>\n' +
	playerTableHeader();

    response.writeHead(200, {"Content-Type": "text/html"});

    displayPlayers('SELECT *, ROUND(rating::numeric,2) AS the_rating FROM players ORDER BY '+order_by+';',
			function rowFn (row) {
			    body += playerRowFn(row); },
			function endFn () { 
			    body += '</table></body></html>\n';	
			    response.write(body);
			    response.end(); });
}


function playerRowFn(player) {
    return '<tr>'+
	'<td>'+player.id+'</td>\n' +
	'<td><a href="./player?id='+player.id+'">'+player.name+'</a></td>\n' +
	'<td>'+player.set_credit+'</td>\n' +
	'<td>'+player.the_rating+'</td>\n' +
	'<td>'+player.ind_wins+'</td>\n' +
	'<td>'+player.ind_losses+'</td>\n' +
	'<td>'+player.draft_wins+'</td>\n' +
	'<td>'+player.draft_ties+'</td>\n' +
	'<td>'+player.draft_losses+'</td>\n' +
	'<td>'+player.money+'</td>\n' +
	'<td>'+util.dateString(player.latest_timestamp)+'</td></tr>\n';

}

function playerTableHeader() {
    return '<table cellpadding="5" cellspacing="0" border="5"><tr><th>ID<th>Name<th>Pack Credit<th>Rating<th>Individual Wins<th>Individual Losses<th>Team Wins<th>Team Ties<th>Team Losses<th>Money<TH>Latest Timestamp</tr>' ;
}

function displayPlayers(querySQL, rowCallback, endCallback) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query(querySQL);
	query.on('row', function(row) { rowCallback(row); });
	query.on('end', function() { endCallback(); });
    });
}

function displayMatches(matches) {
    var body = '<table border=1 cellspacing=0 cellpadding=2><tr><th>Draft ID'+
	'<th>Winner<th>Winner\'s Team<th>Winner Post Rating'+ 
	'<th>Loser<th>Loser\'s Team<th>Loser Post Rating<th>Date';
    
    matches.forEach(function(match) {
	console.log(JSON.stringify(match));
	
	body += '<tr>';
	['<a href="./draft?id='+match.draft_id+'">'+match.draft_id+'</a>', 
	 '<a href="./player?id='+match.winner_id+'">'+match.winner_name+'</a>', 
	 match.winner_team_id, match.winner_rating,
	 '<a href="./player?id='+match.loser_id+'">'+match.loser_name+'</a>', 
	 match.loser_team_id, match.loser_rating,
	 util.dateString(match.timestamp)].forEach(function(v) {
	     body += '<td align=center>'+v;
	 });						  
    });
    
    body += '</table>';
    return body;
}
exports.displayMatches = displayMatches;

function draftInfo(request, response) {
    var qp = util.readGetData(request);
    var draftId = qp['id'];

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	client.query('SELECT m.*, w.name AS winner_name, l.name AS loser_name,'+ 
		     ' ROUND(winner_end_rating::numeric,2) AS winner_rating,'+
		     ' ROUND(loser_end_rating::numeric,2) AS loser_rating'+
                     ' FROM matches m'+
		     ' JOIN players w ON w.id=m.winner_id'+
		     ' JOIN players l ON l.id=m.loser_id'+
		     ' WHERE draft_id = '+draftId+
		     ' ORDER BY id DESC;', 
		     function(err1, result1) {
			 var matches = result1.rows;
			 
			 var body = '<html><head><title> Draft #'+draftId+'</title>'+
			     util.randomColoredStyle(true)+'</head>'+
			     '<body><center>'+displayMatches(matches)+'</body></html>';
			 
			 response.writeHead(200, {"Content-Type": "text/html"});
			 response.write(body);
			 response.end();
		     });
    });
}



function allDrafts (request, response) {

    pg.connect(process.env.DATABASE_URL, function(err, client) {

	var body = '<html><head><title>All Drafts</title>'+
	    util.randomColoredStyle(false)+'</head>'+
	    '<body><center><table>';


	client.query('SELECT * FROM drafts ORDER BY id DESC;', 
		     function(err1, result) {
			 result.rows.forEach(function (draft) {
			     body += '<tr><td><a href="./draft?id='+draft.id+'">'+draft.id+'</a><td>'+util.dateString(draft.timestamp);
			 });
//			 var body = JSON.stringify(result.rows);

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

    app.get('/draft', function(request, response) {
	draftInfo(request, response);
    });

    app.get('/all-drafts', function(request, response) {
	allDrafts(request, response);
    });

}
