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
// var fork = require('child_process').fork, // child processes are different threads that are simply new node threads.
// 	child = fork(__dirname + "/dataGrabber.js");

/* I am using this fakeDataGrabber as a temporary dataGrabber impersonation for the times when dadosabertos server
	is down...
*/
var fork = require('child_process').fork,
	child = fork(__dirname + "/fakeDataGrabber.js");

var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.

var app = express(); // initializing a new express object (as if javascript were object oriented).

var data = {}; // data will hold all the bus lines collected by the dataGrabber.js thread.
// dataGrabber will send everything collected to this server.js thread.
child.on('message', function (message) {
	data = message.data; // message is the object passed from the child process
})

//our first rout
app.get('/', function (req, res) {
	var line = Object.keys(url.parse(req.url, true).query)[0]; // getting the first string from the url request
	// console.log("-> user searching for line: " + line);
	if (typeof line === 'string' && line != "") { // if it is a not empty string, we can send stuff from our data
		// seding sutff from our data, using the same form as dadosabertos server sends their json.
		res.json({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE"], 
					DATA: data[line]}); // our data enters here.
	} else { // until now, theres nothing left to do.
		res.send('hello world!'); 
	}
})

app.get('/:line', function (req, res) {
	var line = req.param("line");
	// console.log(line);
	// console.log("-> user searching for line: " + line);
	if (typeof line === 'string' && line != "") { // if it is a not empty string, we can send stuff from our data
		// seding sutff from our data, using the same form as dadosabertos server sends their json.
		res.json({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE"], 
					DATA: data[line]}); // our data enters here.
	} else { // until now, theres nothing left to do.
		res.send('hello world!'); 
	}
})


// starting our server, using our express instance, on port 8080
var server = app.listen(8080, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

})

