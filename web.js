var express = require('express');
var fs      = require('fs');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
    var htmlBuffer = new Buffer(100);
    htmlBuffer     = fs.readFileSync('index.html');
    var htmlStr    = htmlBuffer.toString();
    response.send(htmlStr);
    response.send('Hello World2!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
