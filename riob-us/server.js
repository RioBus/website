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

var data = {a: "no busses yet"}; // data will hold all the bus lines collected by the dataGrabber.js thread.

// dataGrabber will send everything collected to this server.js thread.
child.on('message', function (message) {
	data = message.data; // 'message' is the object passed from the child process.
})


var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.
var fs = require('fs'); // using fs to read riobus-config.json

var app = express(); // initializing a new express object (as if javascript were object oriented).

// we need to check weather the request comes from android, iOS or a browser.
app.use(function (req, res, next) {
	// console.log(url.parse(req.url, true));
	next();
});

//routing for "riob.us/busLine" requests
app.get('/favicon.ico', function (req, res, next) {
	console.log("-> User just requested our favicon.ico")
})

//routing for "riob.us/?busLine" requests
app.get('/', function (req, res, next) {
	var busLine = req.query.linha; // getting the first string from the url request.
	var platformType = req.query.s; // getting the number sent by the platform that should identify it (android, iOS...).
	if (Object.keys(req.query).length > 0) { // checking if there are any parameters in the request.
		if (typeof busLine === 'string') { // checking if busLine exists.
			console.log("-> user searching for line " + busLine + ", from plataform type " + platformType);
			sendBusLineAsJson(res, busLine); // we define this function to reuse the json format to be sent.

			/*code sample of google analytics usage with ga library*/
			// var ua = "UA-49628280-3";
			// var host = "riob.us";
			// var ga = new GoogleAnalytics(ua, host);
			// ga.trackPage('/en/serverside/test');
			// ga.trackEvent({
			//     category: 'REST Hit',
			//     action: 'REST',
			//     label: 'Site',
			//     value: 1
			// });
			if (typeof platformType === 'string') { // checking if plataform type exists.
				if (platformType == 1) { // dektop browsers.

				} else if (platformType == 2) { // mobile. i don't which mobile it is.

				} else if (platformType == 3) { // legado. i don't know what legado we have.

				}
			}	
		}
	} else { // until now, theres nothing left to do.
		res.send('Main web page should be under this url'); // sending plain text.
	}
})

//routing for "riob.us/busLine" requests
app.get('/:busLine', function (req, res, next) {
	var busLine = req.param("busLine");
	console.log("-> user seaching for line: " + busLine);
	sendBusLineAsJson(res, busLine); // we define this function to reuse the json format to be sent.
})

// reading the port to which our server should listen, from our JSON configuration file
var serverPort = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server.port;

// starting our server, using our express instance, on port 8080
var server = app.listen(serverPort, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

})


// seding sutff from our data, using the same form as dadosabertos server sends their json.
var sendBusLineAsJson = function (res, busLine) {
	res.jsonp({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE, DIRECAO"], 
				DATA: data[busLine]}); // our data enters here.
}