var qs = require('querystring');
var url = require('url');

exports.getIP = function getIP(request) {
    var ip_address = null;
                 
    try { ip_address = request.headers['x-forwarded-for']; }
    catch ( error ) { ip_address = request.connection.remoteAddress; }

    return ip_address
}

exports.getTS = function getTS() {
    return (new String((new Date()).getTime()));
}


exports.readPostData = function readPostData(request, callback) {
    if (request.method == 'POST') {
	console.log('Reading POST data.');
        var body = '';
        request.on('data', function (data) { body += data; });
        request.on('end', function () { var bodyJSON = qs.parse(body); 
					callback(bodyJSON);
					console.log("POST body: " + JSON.stringify(bodyJSON)); });
        } else {
	    callback(null);
	}
}

exports.readGetData = function readGetData(request) {

    console.log('QP: '+url.parse(request.url).query);
    var data = qs.parse(url.parse(request.url).query);
    console.log('DATA: '+JSON.stringify(data));
    var id = data['id'];
    console.log('FACT ID: '+id);

    return qs.parse(url.parse(request.url).query);
}
