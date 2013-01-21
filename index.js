var express = require('express');
var players = require('./players');
var drafts = require('./drafts');

console.log('Starting server.');

var app = express(express.logger());

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

players.setup(app);
drafts.setup(app);

console.log('Finished loading server');
