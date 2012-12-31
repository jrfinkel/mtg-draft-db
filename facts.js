var pg = require('pg');
var util = require('./util');

exports.setup = function setupHandlers(app) {
  
    app.get('/start', function(request, response) {
	handler(request, response, null);
    });

    app.post('/interesting-facts', function(request, response) {
	console.log('Serving up request for interesting-facts');
    
	util.readPostData(request, 
		     function (bodyJSON) 
		     { handler(request, response, bodyJSON); });
    });

    app.get('/thank-you', function(request, response) {
	console.log('Serving up request for thank-you');
    
	response.writeHead(200, {"Content-Type": "text/html"});
    
	var body = '<html><head><title>Thank You!</title></head>' +
	    '<body>Thank you for voting!</body></html>';

	response.write(body);
	response.end();
    });

}

function handler(request, response, body) {
    if (body == null) {
    	display(request, response, 1);
    } else {
	var viewed = parseInt(body['viewed']);
	if (viewed >= 5) {
	    redirectToFinished(response);
	    recordVote(request, body);
	} else {
	    display(request, response, (viewed + 1));
	    recordVote(request, body);
	}
    }
}

function display(request, response, viewed) {
    var body = '<html><head>\n' +
    	'</head><body>\n' +
	'Hello ' + util.getIP(request) +
	'  ::  ' + util.getTS() + 
	'  ::  ' + viewed + '\n' +
	'<form name="the-form" action="/interesting-facts" method="post">\n' +
	'<input type="hidden" name="win_pos" value="-1">\n' +
	'<input type="hidden" name="viewed" value="'+ viewed +'">\n' +
	'<table>\n' +
	'<tr><td>Click on the more interesting fact.</td></tr>\n' ;

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var query = client.query('SELECT * FROM paul_facts2 ORDER BY random() LIMIT 2;');

	response.writeHead(200, {"Content-Type": "text/html"});

	var num = 0;
	query.on('row', function(row) {
	    console.log("Fact to compare: " +JSON.stringify(row));
	    var n = num++;
	    body += '<tr><td><hr>' + 
		'<input type="hidden" name="fact'+ n +'_id" value="'+ row['id'] +'">\n' +
		row['id'] + '<BR>' +
		'<a href="#" onclick="document.forms[0].win_pos.value = ' + n +'; ' +
		'document.forms[0].submit();">'+
		row['fact_text'] + 
		'</a><hr></td></tr>\n';
	});

	query.on('end', function() {
	    body += '</table>\n' +
	    '</form></body></html>\n';	

	    response.write(body);
	    response.end();
	});
    });
}


function redirectToFinished(response) {
    response.writeHead(302, {'Location': '/thank-you'});
    response.end();
}


function recordVote(request, body) {
    var ip = util.getIP(request);
    var ts = util.getTS();

    console.log('About to parse vote from '+ip+' at '+ts+'.');

    var win_id, lose_id;
    var win_pos = parseInt(body['win_pos']);
    if (win_pos == 0) {
	win_id = body['fact0_id'];
	lose_id = body['fact1_id'];
    } else if (win_pos == 1) {
	win_id = body['fact1_id'];
	lose_id = body['fact0_id'];
    } else {
	console.log('ERROR RECORDING VOTE: '+JSON.stringify(body));
	return;
    } 

    console.log('About to record vote from '+ip+' at '+ts+'. winner: '+win_id+'; loser: '+lose_id);

    pg.connect(process.env.DATABASE_URL, function(err, client) {
	var q = 'INSERT INTO comparisons (win_id, lose_id, comparer_ip, ts) VALUES ('+ win_id +', '+ lose_id + ', \'' + ip + '\', ' + ts +');';
	console.log('About to query: ' + q);
	var query = client.query(q);	
	query.on('row', function(row) { console.log('Recording vote from '+ip+' at '+ts+'. winner: '+win_id+'; loser: '+lose_id+'. Row returned: '+row); });
	query.on('end', function(row) { console.log('Recorded vote from '+ip+' at '+ts+'. winner: '+win_id+'; loser: '+lose_id); });
    });
}
