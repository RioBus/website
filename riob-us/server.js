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
var fs = require('fs'); // using fs to read riobus-config.json.
var compression = require('compression') // compression middleware to compress files before sending on response.

var app = express(); // initializing a new express object (as if javascript were object oriented).
app.use(compression()); // compress with gzip every content that will be sent.

//routing for "riob.us/" requests
app.get('/', function (req, res, next) {
	// if we can find the 'linha' and 's' paramaters in the request url, it means the request is searching for a bus line.
	if (Object.keys(req.query).length > 0) { // checking if there are any parameters in the request.
		// getting the first string from the url request.
		var busLine = req.query.linha;
		// getting the number sent by the platform that should identify it (android, iOS...).
		var platformType = req.query.s;

		if (typeof busLine === 'string') { // checking if busLine paramater exists.
			//send json with the respective bus line information
			sendBusLineAsJson(res, busLine); // function defined because it is being reused by the rest api

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

				} else {

				}
			}	
		}
	} else { // request has no paramaters. we have to send the index.html file.
		next() // as we are using express.static middleware, we can here move to the next middleware
	}
})

/*	using express.static middleware to serve static files. it only serves existing files and calls next() 
	when file is not found. */
app.use(express.static(__dirname + '/public')); // setting express.static to use '/public' as the root static folder.

//routing for "riob.us/busLine" requests
app.get('/:busLine', function (req, res, next) {
	var busLine = req.param("busLine");
	sendBusLineAsJson(res, busLine); // function defined because it is also being used in the queryed url
})

// reading the port to which our server should listen, from our JSON configuration file.
var configServer = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server;

// starting our server, using our express instance, on port specified by our JSON configuration file.
var server = app.listen(configServer.port, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

})


// seding sutff from our data, using the same form as dadosabertos server sends their json.
var sendBusLineAsJson = function (res, busLine) {

	// requests can query for more than 1 bus line like this: 'linha="213,341,485"'.
	var busLines = busLine.split(","); // returns an array with the string splited by commas (",").
	// we will only accept 10 bus lines in the query. configurable on our config JSON file.
	if (busLines.length > configServer.maxBusLines) // if there's more than 10.
		busLines = busLines.slice(0,configServer.maxBusLines); // we will get the 10 first bus lines.

	// we need to remove duplicates.
	var hash = {} // creating an object to work as a hashmap structure.
	for (var i = busLines.length - 1; i >= 0; i--) { // for each bus lines.
		if (!hash[busLines[i]]) // if this bus lines string is a non existing attribute inside our object.
			hash[busLines[i]] = true; // create this attribute in it, with a simple boolean (could be anything)
	};
	busLines = Object.keys(hash); // now get just the attribute names of the object (the keys of the hash).
	var returnData = [] // building return that will be sent on response.
	for (var i = busLines.length - 1; i >= 0; i--) { // for each bus line in the query.
		var busses = data[busLines[i]]; // get the array containing all busses in it.
		if (busses) // if this array exists.
			returnData = returnData.concat(busses); // oncactenate with what's inside the return variable.
	};
	// send json on response.
	res.jsonp({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE, DIRECAO"], 
				DATA: returnData, // our return data enters here.
				LASTUPDATE: data.lastUpdate});
}