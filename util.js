var qs = require('querystring');
var url = require('url');

exports.randomColoredStyle = function randomColoredStyle(isblack) {
    var images = ['https://raw.github.com/jrfinkel/fact-images/master/magic-images/grumpy.jpg',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/elsie.jpg',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/harry.jpg',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/melvin.jpg',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/melvin1.jpg',
 		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/dinner.jpg',
 		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/noam.jpg',
 		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/jon3.jpg',
 		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/jon5.jpg'];

    var r = Math.floor(Math.random() * images.length);
    var image = images[r];
    var color; 
    if (isblack) { color = 'black' }
    else { color = 'red'; }
    
    var style = '<style type="text/css">\n' +
	'body     { background-image:url('+image+'); color: '+color+' }' +
	'th tr td { vertical-align: middle; }' +
	'table    { background-color: white; color: '+color+' }' +
	'</style>';

    return style

}

exports.randomStyle = function randomStyle() {
    return exports.randomColoredStyle(false);
}

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

    return qs.parse(url.parse(request.url).query);
}

exports.dateString = function dateString(ts) {
    return '' + new Date(ts);
}
