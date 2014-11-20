/*	things to do in this code
	1- keep updating comments as code changes.
*/

/* ==================
	this is the server code. where we are going to serve a rest interface and the website pages.
*/

var winston = require('winston'); // importing library that will help us write better logs.

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
// 'orders' will hold all busses, queryble by bus order.
var orders = {a: "no busses yet"};
var lastUpdate; // 'lastUpdate' will hold the date and time of the last successful response we've got from dadosabertos.
var lastStatus; // 'lastStatus' will hold the case that indicates whether dataGabber was sucessful or how much it wasn't.

// dataGrabber will send everything collected to this server.js thread.
channelToDataGrabber.on('message', function (message) { // 'message' is the object passed from the child process.
	data = message.data; // copying child processes' 'data' over our current 'data'.
	json = message.json  // copying child processes' 'json' over our current 'json'.
	orders = message.orders; // copying child processes' 'orders' over our current 'orders'.
	lastUpdate = message.lastUpdate; // copying child processes' 'lastUpdate' over our current 'lastUpdate'.
	lastStatus = message.lastStatus; // copying child processes' 'lastStatus' over our current 'lastStatus'.
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

	// if we can find the 'linha' and 's' paramaters in the request url, it means the request is searching for a bus line.
	if (Object.keys(req.query).length > 0) { // checking if there are any parameters in the request.
		// getting the 'linha' paramater from the url request.
		var busLine = req.query.linha;
		// getting the number sent by the platform that should identify it (android, iOS...).
		var platformType = req.query.s;
		// getting the 'ordem' paramater from the url request.
		var busOrder = req.query.ordem;

		if (busLine || busOrder) { // checking if busLine or busOrder paramaters exists.
			//send json with all busses belonging to these bus lines and all bus orders.
			sendQueriedItemAsJson(res, busLine, busOrder); // function defined because it is  being reused by the rest api.

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
		} else {
			//busLine and busOrder were not defined. we could send a 404 bad request.
		}
	} else { // request has no paramaters. we have to send the index.html file.
		next() // in this case, move to next matching route.
	}
})

//routing for "riob.us/all" requests. returns all busses.
app.get('/all', function (req, res, next) {
	// returnuning the dadosabertos server json with two more attributes, 'LASTUPDATE' and 'LASTSTATUS'.
	res.jsonp(json);
})

/*	using express.static middleware to serve static files. it only serves existing files and calls next() 
	when file is not found. */
app.use(express.static(__dirname + '/public')); // setting express.static to use '/public' as the root static folder.
// 'static' serves index.html as default for root path on request's url.

//routing for "riob.us/linha/busLine" requests. returns every bus in the specified bus lines.
app.get('/linha/:busLine', function (req, res, next) {
	var busLine = req.param("busLine");

	// sending json with at most unique 10 bus lines.
	sendQueriedItemAsJson(res, busLine, null);
})

//routing for "riob.us/ordem/busOrder" requests. returns every bus in the specified bus lines.
app.get('/ordem/:busOrder', function (req, res, next) {
	var busOrder = req.param("busOrder");

	// sending json with at most 10 unique bus orders.
	sendQueriedItemAsJson(res, null, busOrder);
})

app.get('/log/dataGrabber', function (req, res, next) {
	sendLastLines(dataGrabberLogHolder,res)
})

app.get('/log/server', function (req, res, next) {
	sendLastLines(serverLogHolder,res)
})

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/* +++++++++++++++++++++++++++++++++++++++++++++ ROUTES +++++++++++++++++++++++++++++++++++++++++++++ */
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */


// reading the port to which our server should listen, from our JSON configuration file.
var configServer = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server;

// starting our server, using our express instance, on port specified by our JSON configuration file.
var server = app.listen(configServer.port, function () {

	var host = server.address().address;
	var port = server.address().port;

	logger.info('Server listening at http://%s:%s', host, port);

})


/*	seding sutff from our 'data' or 'orders', using the same form as dadosabertos server sends their json.
	if we don't want to add any bus line or any bus order to the final json, just pass an empty array
	in the respective paramater. */
function sendQueriedItemAsJson (res, busLinesString, busOrdersString) {

	var busLines = returnQueriedItemsAsArray(busLinesString);
	var busOrders = returnQueriedItemsAsArray(busOrdersString);

	var returnData = [] // building return that will be sent on response.
	returnData = selectAndConcatenateData(data, busLines, returnData);
	returnData = selectAndConcatenateData(orders, busOrders, returnData);

	// send json on response.
	res.jsonp({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE", "DIRECAO"], 
				DATA: returnData, // our return data enters here.
				LASTUPDATE: lastUpdate,
				LASTSTATUS: lastStatus});
}

// spliting the busses (or orders), removing duplicates and getting an array with the 10 first items.
function returnQueriedItemsAsArray (paramaterString) {
	if (!paramaterString) return []; // if 'paramaterString' is undefined, return an empty array.

	// requests can query for more than 1 bus line like this: 'linha="213,341,485"'. Same for bus orders.
	var queryItems = paramaterString.split(","); // returns an array with the string splited by commas (",").
	// we will only accept 10 bus lines in the query. configurable on our config JSON file.
	if (queryItems.length > configServer.maxBusLines) // if there's more than 10.
		queryItems = queryItems.slice(0,configServer.maxBusLines); // we will get the 10 first bus lines.

	// we need to remove duplicates.
	var hash = {} // creating an object to work as a hashmap structure.
	for (var i = queryItems.length - 1; i >= 0; i--) { // for each bus lines.
		if (!hash[queryItems[i]]) // if this bus lines string is a non existing attribute inside our object.
			hash[queryItems[i]] = true; // create this attribute in it, with a simple boolean as value (could be anything).
	};
	return Object.keys(hash); // now get just the attribute names of the object (the keys of the hash).
}

/*	concatenate values of every key in 'queriedItems' from given 'structure' to 'returnArray'.
	'structure' is either 'data' or 'json'. */
function selectAndConcatenateData (structure, queriedItems, returnArray) {
	for (var i = queriedItems.length - 1; i >= 0; i--) { // for each bus line in the query. or bus order.
		var item = structure[queriedItems[i]]; // get the array containing all busses in it.
		if (item) // if this array exists.
			returnArray = returnArray.concat(item); // concatenate with what's inside the return variable.
	};
	return returnArray;
}

var numberOfLastLines = 40; // number of lines to get from the end of log files.
var stream = require('stream'); // using stream library to create an intance of writeble stream.
function LogHolder() { // creating a writeable stream class
	this.writableStrem = new stream.Writable(); // instantiating a new writable object.
	this.writableStrem.logs = [] // adding an attribute that will hold log messages.
	this.writableStrem._write = function (chunk, encoding, done) { // defining stream's write function.
		var log = JSON.parse(chunk.toString()) // parse one line as a javascript object.
		this.logs.push(log.timestamp + "\t" + log.level + "\t" + log.message + "\n"); // making it a string.
		if (this.logs.length > numberOfLastLines) // if array has more than maximum of elements.
			this.logs.shift() // drop first element.
		done();
	};
	return this.writableStrem; // return new object.
}

var dataGrabberLogHolder = new LogHolder(); // creating an object to hold dataGrabber's logs.
var serverLogHolder = new LogHolder(); // creating an object to hold server's logs.
var sf = require('slice-file'); // library that can read files backwards and retrive the last lines using small memory.
// geting last lines of each file and piping them to their respective log holder object.
sf('./dataGrabberLog.log', opts={}).follow(-numberOfLastLines).pipe(dataGrabberLogHolder);
sf('./serverLog.log', opts={}).follow(-numberOfLastLines).pipe(serverLogHolder);

// concatenates each log line from specified 'logHolder' and send it on response.
function sendLastLines(logHolder, response) {
	var returnText = "timestamp\t\t\t\t\tlevel\tmessage\n"; // header text for the browser.
	for (var i = logHolder.logs.length - 1; i >= 0; i--) {
		returnText += logHolder.logs[i]
	};
	response.set('Content-Type', 'text/plain') // setting header.
	response.send(returnText); // sending content.
}