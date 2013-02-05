var qs = require('querystring');
var url = require('url');

exports.randomStyle = function randomStyle() {
    var imagesAndColors = {'http://i2.kym-cdn.com/photos/images/newsfeed/000/406/325/b31.jpg': 'red',
		  'http://www.roflcat.com/images/cats/270911970_db35fdd4ca.jpg': 'orange',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/elsie.jpg': 'pink', 
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/harry.jpg': 'purple',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/melvin.jpg': 'blue',
		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/melvin1.jpg': 'green',
 		  'https://raw.github.com/jrfinkel/fact-images/master/magic-images/dinner.jpg': 'yellow'
		 };

    var images = Object.keys(imagesAndColors);
    var image = images[Math.floor(Math.random() * (images.length + 1))];
    var color = imagesAndColors[image];
    
    var style = '<style type="text/css">\n' +
	'body {\n' +
	'background-image:url('+image+')}' +
	'</style>';

    return style

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
    var id = data['id'];
    console.log('FACT ID: '+id);

    return qs.parse(url.parse(request.url).query);
}
