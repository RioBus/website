/*	things to do in this code
	1- keep updating comments as code changes.
This way, we don't need to restart the code if those things change.
	2- delete comments that print information that is useless for this code. bus line being queryed.
This kind of information is useful for someone else, somewhere else, but not here, not for this code.
	3- add the code that will serve the website pages
*/


/* ==================
	this is the server code. where we are going to serve a rest interface and the website pages.
*/

// we start by calling the dataGrabber.js file in another thread.
var fork = require('child_process').fork, // child processes are different threads that are simply new node threads.
	child = fork(__dirname + "/dataGrabber.js");

/* I am using this fakeDataGrabber as a temporary dataGrabber impersonation for the times when dadosabertos server
	is down...
*/
// var fork = require('child_process').fork,
// 	child = fork(__dirname + "/fakeDataGrabber.js");

var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.

var app = express(); // initializing a new express object (as if javascript were object oriented).

var data = {}; // data will hold all the bus lines collected by the dataGrabber.js thread.
// dataGrabber will send everything collected to this server.js thread.
child.on('message', function (message) {
	data = message.data; // 'message' is the object passed from the child process.
})

// we need to check weather the request comes from android, iOS or a browser.
app.use(function (req, res, next) {
  console.log(" - User-Agent: " + req.get('User-Agent'));
  next();
});

//routing for "riob.us/busLine" requests
app.get('/favicon.ico', function (req, res, next) {
	console.log("-> User just requested our favicon.")
})

//routing for "riob.us/?busLine" requests
app.get('/', function (req, res, next) {
	var busLine = Object.keys(url.parse(req.url, true).query); // getting the first string from the url request
	if (busLine.length > 0) { // accepting one or more bus lines in the request .
		busLine = busLine[0]; //actually, just accepting the first one.
		// we need to learn the format used when sending more than one bus line in the same json.
		if (typeof busLine === 'string' && busLine != "") { // if it is a not empty string, we can send stuff from our data
			console.log("-> user searching for line: ?" + busLine);
			// seding sutff from our data, using the same form as dadosabertos server sends their json.
			res.json({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE"], 
						DATA: data[busLine]}); // our data enters here.
		}
	} else { // until now, theres nothing left to do.
		res.send('Main web page should be under this url'); // sending plain text.
	}
})

//routing for "riob.us/busLine" requests
app.get('/:busLine', function (req, res, next) {
	var busLine = req.param("busLine");
	console.log("-> user seaching for line: " + busLine);
	// seding sutff from our data, using the same form as dadosabertos server sends their json.
	res.json({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE"], 
				DATA: data[busLine]}); // our data enters here.
})


// starting our server, using our express instance, on port 8080
var server = app.listen(8080, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

})

