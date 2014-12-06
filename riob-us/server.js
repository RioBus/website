/*	things to do in this code
	1- keep updating comments as code changes.
*/

/* ==================
	this is the server code. where we are going to serve a rest interface and the website pages.
*/

var winston = require('winston'); // importing library that will help us write better logs.

/*code sample of google analytics usage with nodealytics library*/
var ua = "UA-49628280-3";
var hostAnalytics = "riob.us";
var NA = require("nodealytics");
NA.initialize(ua, hostAnalytics, function () {
  //MORE GOOGLE ANALYTICS CODE HERE
});
NA.trackPage('REST', '/en/serverside/test', function (err, resp) {
  if (!err && resp.statusCode === 200) {
   // console.log('Page has been tracked with Google Analytics');
  }
});

// function that returns our standart time stamp format. I'm using it for the loggers and for the json's 'lastUpdate'.
function timeStamp () {return (new Date()).toLocaleString()} 

/*	creating a custom log writer. It will log on console and in a file. 
	it seems that handling exceptions mean that it will log it and won't abort the code. im not sure. */
var consoleTransportOptions = {
	colorize: true, // color is only visible on command line tool.
	timestamp: timeStamp
};
var fileTransportOptions = { 
	filename: 'serverLog.log',
	handleExceptions: true, // i dont know if we shouldn't abort code on exceptions. i don't know what might happen.
	colorize: true, // color is only visible on command line tool.
	timestamp: timeStamp,
};
var logger = new (winston.Logger)({ transports: [ new (winston.transports.Console)(consoleTransportOptions),
												  new (winston.transports.File)(fileTransportOptions) ] });

// we start by calling the dataGrabber.js file in another thread.
var fork = require('child_process').fork, // child processes are different threads that are simply new node threads.
	channelToDataGrabber = fork(__dirname + "/dataGrabber.js");

/* I am using this fakeDataGrabber as a temporary dataGrabber impersonation for the times when dadosabertos server
	is down... */
// var fork = require('child_process').fork,
// 	channelToDataGrabber = fork(__dirname + "/fakeDataGrabber.js");

// 'data' will hold all the bus lines,with their respective busses, collected by the dataGrabber.js thread.
var data = {a: "no busses yet"};
// 'json' will hold the exact json that comes from dadosabertos server, plus the lastUpdate date and time.
var json = {a: "no busses yet"};
var lastUpdate; // 'lastUpdate' will hold the date and time of the last successful response we've got from dadosabertos.
var lastStatus; // 'lastStatus' will hold the case that indicates whether dataGabber was sucessful or how much it wasn't.

// dataGrabber will send everything collected to this server.js thread.
channelToDataGrabber.on('message', function (message) { // 'message' is the object passed from the child process.
	data = message.data || data; // copying child processes' 'data' over our current 'data' if it exists on 'message'.
	json = message.json || json; // copying child processes' 'json' over our current 'json' if it exists on 'message'.
	lastUpdate = message.lastUpdate || lastUpdate; // copying child processes' 'lastUpdate' over our current 'lastUpdate'.
	lastStatus = message.lastStatus || lastStatus; // copying child processes' 'lastStatus' over our current 'lastStatus'.
	json.LASTUPDATE = lastUpdate; // adding 'LASTUPDATE' attribute to 'json'.
	json.LASTSTATUS = lastStatus; // adding 'LASTSTATUS' attribute to 'json'.
})


var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.
var fs = require('fs'); // using fs to read riobus-config.json.
var compression = require('compression') // compression middleware to compress files before sending on response.
var sf = require('slice-file'); // library that can read files backwards and retrive the last lines using small memory.

var app = express(); // initializing a new express object (as if javascript were object oriented).
app.use(compression()); // compress with gzip every content that will be sent.

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/* +++++++++++++++++++++++++++++++++++++++++++++ ROUTES +++++++++++++++++++++++++++++++++++++++++++++ */
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

//routing for "riob.us/" requests
app.get('/', function (req, res, next) {
	logger.info("User's referer is: " + req.headers['referer']);

	// if we can find the 'linha' and 's' parameters in the request url, it means the request is searching for a bus line.
	if (Object.keys(req.query).length > 0) { // checking if there are any parameters in the request.
		// getting the 'busca' parameter from the url request.
		var searchString = req.query.busca;
		// getting the number sent by the platform that should identify it (android, iOS...).
		var platformType = req.query.s;

		if (searchString) { // checking if searchString parameters exists.
			//send json with all busses belonging to these bus lines and all bus orders.
			sendQueriedItemAsJson(res, searchString); // function defined because it is  being reused by the rest api.

			if (platformType) { // checking if plataform type exists.
				if (platformType == 1) { // dektop browsers.

				} else if (platformType == 2) { // mobile. i don't which mobile it is.

				} else if (platformType == 3) { // legado. i don't know what legado we have.

				} else {

				}
				
				// tracking source
				NA.trackEvent('REST+Hit', 'REST', label, platformType, function (err, resp) {
				  if (!err && resp.statusCode === 200) {
					//console.log('Event has been tracked with Google Analytics');
				  }
				});
				
				// tracking search string
				NA.trackEvent('REST+Hit', 'Linha', searchString, searchString, function (err, resp) {
				  if (!err && resp.statusCode === 200) {
					//console.log('Event has been tracked with Google Analytics');
				  }
				});
			}	
		} else {
			//busLine and busOrder were not defined. we could send a 404 bad request.
		}
	} else { // request has no parameters. we have to send the index.html file.
		next() // in this case, move to next matching route.
	}
})

//routing for "riob.us/all" requests. returns all busses.
app.get('/all', function (req, res, next) {
	// returnuning the dadosabertos server json with two more attributes, 'LASTUPDATE' and 'LASTSTATUS'.
	res.jsonp(json); // send json on response. 'jsonp' means we accepted external requests.
})

/*	using express.static middleware to serve static files. it only serves existing files and calls next() 
	when file is not found. */
app.use(express.static(__dirname + '/public')); // setting express.static to use '/public' as the root static folder.
// 'static' serves index.html as default for root path on request's url.

//routing for "riob.us/linha/busLine" requests. returns every bus in the specified bus lines.
app.get('/busca/:busca', function (req, res, next) {
	var busca = req.param("busca");
	sendQueriedItemAsJson(res, busca); // sending json with at most unique 10 items.
})

app.get('/log/dataGrabber', function (req, res, next) {
	res.set('Content-Type', 'text/plain') // setting header.
	res.send(getLasLogLines(dataGrabberLogHolder)); // sending content.
})

app.get('/log/server', function (req, res, next) {
	res.set('Content-Type', 'text/plain') // setting header.
	res.send(getLasLogLines(serverLogHolder)); // sending content.
})

app.get('/log', function (req, res, next) {
	res.set('Content-Type', 'text/plain') // setting header.
	res.send('dataGrabber\n' + getLasLogLines(dataGrabberLogHolder) + "\n" +
			 'server\n' + getLasLogLines(serverLogHolder)); // sending content.
})
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/* +++++++++++++++++++++++++++++++++++++++++++++ ROUTES +++++++++++++++++++++++++++++++++++++++++++++ */
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */


// reading the port to which our server should listen, from our JSON configuration file.
var configServer = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server;

// starting our server, using our express instance, on port specified by our JSON configuration file.
var server = app.listen(configServer.port, configServer.address, function () {

	var host = server.address().address;
	var port = server.address().port;

	logger.info('Server listening at http://%s:%s', host, port);

})


/*	seding sutff from our 'data', using the same form as dadosabertos server sends their json.
	if we don't want to add any bus line or any bus order to the final json, just pass an empty array
	in the respective JSON attribute. */
function sendQueriedItemAsJson (res, queryString) {
	var splitedQuery = returnQueriedItemsAsArray(queryString); // split the 10 first items
	var returnData = selectAndConcatenateData(splitedQuery); // building return that will be sent on response.
	// send json on response. 'jsonp' means we accepted external requests.
	res.jsonp({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE", "DIRECAO"], 
				DATA: returnData, // our returned array enters here.
				LASTUPDATE: lastUpdate,
				LASTSTATUS: lastStatus});
}

// spliting the query, gets an array with the 10 first items and removes duplicates.
function returnQueriedItemsAsArray (parameterString) {
	if (!parameterString) return []; // if 'parameterString' is empty, return an empty array.

	// requests can query for more than 1 item like this: 'busca="213,341,C12345"'.
	var queryItems = parameterString.split(","); // returns an array with the string splited by commas (",").
	// we will only accept 10 item in the query. configurable on our config JSON file.
	if (queryItems.length > configServer.maxSearchedItems) // if there's more than 10.
		queryItems = queryItems.slice(0, configServer.maxSearchedItems); // we will get the 10 first of them.

	// we need to remove duplicates.
	var hash = {} // creating an object to work as a hashmap structure.
	for (var i = queryItems.length - 1; i >= 0; i--) { // for each searched item.
		if (!hash[queryItems[i]]) // if this item's string is a non existing attribute inside our object.
			hash[queryItems[i]] = true; // create this attribute in it, with a simple boolean as value (could be anything).
	};
	return Object.keys(hash); // now get just the attribute names of the object (the keys of the hash).
}

/*	concatenate values of every key in 'queriedItems', upperCased(), from 'data' and return them in one array. */
function selectAndConcatenateData (queriedItems) {
	var returnArray = []; // array that will be returned.
	for (var i = queriedItems.length - 1; i >= 0; i--) { // for each item in the query.
		var array = data[queriedItems[i].toUpperCase()]; // make it upper case and get the array value related to it.
		if (array) // if this array exists.
			returnArray = returnArray.concat(array); // concatenate it with the array tha that will be returned.
	};
	return returnArray;
}

var amountOfLines = configServer.numberOfLastLogLines; // number of lines to get from the end of log files.
var stream = require('stream'); // using stream library to create an intance of writable stream.
function LogHolder() { // creating a writeable stream class
	this.writableStrem = new stream.Writable(); // instantiating a new writable object.
	this.writableStrem.logs = [] // adding an attribute that will hold log messages.
	this.writableStrem._write = function (chunk, encoding, done) { // defining stream's write function.
		try { // checking if log line is parsable.
			var log = JSON.parse(chunk.toString()) // parse one line as a javascript object.
			this.logs.push("- " + log.timestamp + "\t" + log.level + "\t" + log.message + "\n"); // making it a string.
		} catch (err) { // if not, save the error.
			this.logs.push("- bad log line: " + err.messages)
		}
		if (this.logs.length > amountOfLines) // if array has more than maximum of elements.
			this.logs.shift() // drop first element.
		done();
	};
	return this.writableStrem; // return new object.
}

var dataGrabberLogHolder = new LogHolder(); // creating an object to hold dataGrabber's logs.
var serverLogHolder = new LogHolder(); // creating an object to hold server's logs.
var sf = require('slice-file'); // library that can read files backwards and retrive the last lines using small memory.
// geting last lines of each file and piping them to their respective log holder object.
sf('./dataGrabberLog.log', opts={}).follow(-amountOfLines).pipe(dataGrabberLogHolder); // 'sf' is a slice-file instance.
sf('./serverLog.log', opts={}).follow(-amountOfLines).pipe(serverLogHolder); // 'follow()' watches for new messages.
// 'pipe' sends all new messages to the writable stream on its parameter.

// concatenates each log line from specified 'logHolder' and send it on response.
function getLasLogLines(logHolder, response) {
	var returnText = "- timestamp\t\t\t\t\tlevel\tmessage\n"; // header text for the browser.
	for (var i = logHolder.logs.length - 1; i >= 0; i--) {
		returnText += logHolder.logs[i]
	};
	return returnText;
}
