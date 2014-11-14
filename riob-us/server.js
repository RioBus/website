/*	things to do in this code
	1- keep updating comments as code changes.
This way, we don't need to restart the code if those things change.
	2- delete comments that print information that is useless for this code. bus line being queried.
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

// 'data' will hold all the bus lines,with their respective busses, collected by the dataGrabber.js thread.
var data = {a: "no busses yet"};
// 'json' will hold the exact json that comes from dadosabertos server, plus the lastUpdate date and time.
var json = {a: "no busses yet"};
// 'orders' will hold all busses, queryble by bus order.
var orders = {a: "no busses yet"};
// 'lastUpdate' will hold the date and time of the last successful response we've got from dadosabertos.
var lastUpdate;

// dataGrabber will send everything collected to this server.js thread.
child.on('message', function (message) { // 'message' is the object passed from the child process.
	data = message.data; // copying child processes' 'data' over our current 'data'.
	json = message.json  // copying child processes' 'json' over our current 'json'.
	orders = message.orders; // copying child processes' 'orders' over our current 'orders'.
	lastUpdate = message.lastUpdate; // copying child processes' 'lastUpdate' over our current 'lastUpdate'.
})


var express = require('express'); // we are using express as our middleware. it has lots of cool functionalities.
var url = require('url'); // we use url module to parse the url in the request, sent to us, and extract the bus line.
var fs = require('fs'); // using fs to read riobus-config.json.
var compression = require('compression') // compression middleware to compress files before sending on response.

var app = express(); // initializing a new express object (as if javascript were object oriented).
app.use(compression()); // compress with gzip every content that will be sent.

/* ++++++++++++++++++++++++++++++ ROUTES ++++++++++++++++++++++++++++++ */

//routing for "riob.us/" requests
app.get('/', function (req, res, next) {
	console.log(" - user's referer is: " + req.headers['referer']);

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
		next() // as we are using express.static middleware, we can here move to the next middleware
	}
})

//routing for "riob.us/all" requests. returns all busses.
app.get('/all', function (req, res, next) {
	// returnuning the dadosabertos server json with one more attribute, 'lastUpdate'.
	res.jsonp({COLUMNS:["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE", "DIRECAO"], 
				DATA: json, // only 'DATA' value from dadosabertos server.
				LASTUPDATE: lastUpdate});
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

/* ++++++++++++++++++++++++++++++ ROUTES ++++++++++++++++++++++++++++++ */

// reading the port to which our server should listen, from our JSON configuration file.
var configServer = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).server;

// starting our server, using our express instance, on port specified by our JSON configuration file.
var server = app.listen(configServer.port, function () {

	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);

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
				LASTUPDATE: lastUpdate});
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

function selectAndConcatenateData (structure, queriedItems, returnArray) {
	for (var i = queriedItems.length - 1; i >= 0; i--) { // for each bus line in the query.
		var item = structure[queriedItems[i]]; // get the array containing all busses in it.
		if (item) // if this array exists.
			returnArray = returnArray.concat(item); // concatenate with what's inside the return variable.
	};
	return returnArray;
}