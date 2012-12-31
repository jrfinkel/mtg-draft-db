var pg = require('pg');

var util = require('./util');

exports.setup = function setupHandlers (app) {
    app.get('/admin', function(request, response) {
	adminPage(response);
    });

    app.get('/realTime', function(request, response) {
	realTime(response);
    });

    app.get('/runningTally', function(request, response) {
    });

    app.get('/statsByFact', function(request, response) {
    });

    app.get('/fact', function(request, response) {
	fact(request, response);
    });

}

function adminPage (response) {

    var body = '<html><head><title>Admin</title></head><body>' +
	'<h2>Hello Paul! I hope you\'re having a good day.</h2>' +
	'<a href="./start">Start collecting facts</a> (this is the link you will send people)<br><hr><br>' +
	'<a href="./realTime">Real-time votes</a><br><hr><br>' +
	'<a href="./statsByFact">All Fact</a><br><hr><br>' +
	'<a href="./runningTally">Current Ranking</a><br><hr><br>' ;


    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function realTime (response) {
    var body = '<html><head>\n'+
	'<title>Real-time Votes</title>\n' +
    	'</head><body>\n' +
	'<h2>Displaying (up to) the 500 most recent results</h2>' +
	compareTableHeader();

    response.writeHead(200, {"Content-Type": "text/html"});

    processQueryResults('SELECT * FROM comparisons ORDER BY ts DESC LIMIT 500;', 
			function rowFn (row) {
			    console.log('hi there');
			    body += compareRowFn(row); },
			function endFn () { 
			    console.log('good-bye');
			    body += '</table></body></html>\n';	
			    response.write(body);
			    response.end(); });
}

function fact(request, response) {
    var data = util.readGetData(request);
    var id = data['id'];

    response.writeHead(200, {"Content-Type": "text/html"});

    var body = '<html><head>\n'+
	'<title>Fact '+id+'</title>\n' +
    	'</head><body>\n' +
	'<h2>Information on Fact #'+id+'</h2>\n';
    
    processQueryResults('SELECT * FROM paul_facts2 WHERE id = '+id+';',
			function rowFn (row) {
			    body += row['fact_text'] + 
				'<BR><HR>\n<h3>Score: ' + 
				row['score'] + '\n'; },
			function endFn () {
			    processQueryResults('SELECT COUNT(*) FROM comparisons WHERE win_id = '+id+';',
						function rowFn (row) {
						    body += '<h3>Wins: ' + row['count'] + '\n';
						}, function endFn() {

			    processQueryResults('SELECT COUNT(*) FROM comparisons WHERE lose_id = '+id+';',
						function rowFn (row) {
						    body += '<h3>Losses: ' + row['count'] + '\n';
						}, function endFn() {
						    body += '<BR><HR><BR>\n' + 
							compareTableHeader() + 
							'\n';

			    processQueryResults('SELECT * FROM comparisons WHERE win_id = '+id+' OR lose_id = '+id+';',
						function rowFn (row) {
						    body += compareRowFn(row); },
						function endFn () {
						    body += '</table></body></html>\n';	
						    response.write(body);
						    response.end(); });});});
			});
}

function compareRowFn(row) {
    return '<tr><td><a href="./fact?id='+row['win_id']+'">'+row['win_id']+'</a></td>\n' +
	'<td><a href="./fact?id='+row['lose_id']+'">'+row['lose_id']+'</a></td>\n' + 
	'<td>'+row['comparer_ip']+'</td>\n' +
	'<td>'+(new Date(row['ts'])).toString()+'</td></tr>';
}

function compareTableHeader() {
    return '<table cellpadding="5" cellspacing="0" border="5"><tr><th>winning fact<th>losing fact<th>IP address<th>timestamp</tr>' ;
}

function processQueryResults(querySQL, rowCallback, endCallback) {
    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query(querySQL);
	query.on('row', function(row) { console.log(row); rowCallback(row); });
	query.on('end', function() { console.log("end"); endCallback(); });
    });
}
