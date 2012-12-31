var express = require('express');

var facts = require('./facts');
var admin = require('./admin');

console.log('Starting server.');

var app = express(express.logger());

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

facts.setup(app);
admin.setup(app);

console.log('Finished loading server');
