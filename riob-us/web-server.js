/*	things to do in this code
	1- keep updating comments as code changes.
This way, we don't need to restart the code if those things change.
	2- delete comments that print information that is useless for this code. bus line being queryed.
This kind of information is useful for someone else, somewhere else, but not here, not for this code.
	3- add the code that will serve the website pages
*/


/* ==================
	this is the web server code. where we are going to serve the static files as html, css, js and images.
*/

var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.
var fs = require('fs'); // using fs to read riobus-config.json

var app = express(); // initializing a new express object (as if javascript were object oriented).

app.use(express.static(__dirname + '/public')); // setting express to use public as the root static folder

//routing for "riob.us/" requests for static files. Showing index.html
app.get('/', function (req, res) {
	res.sendfile('public/index.html');
})

// reading the port to which our server should listen, from our JSON configuration file
var serverPort = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server.port;

// starting our server, using our express instance, on port 8080
var server = app.listen(serverPort, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

})