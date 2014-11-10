/*	things to do in this code
	1- keep updating comments as code changes.
*/


/*	==================
	We will perform a GET resquest, for all the busses, to dadosaberto.rio.gov.br

	we have to send a GET request to this url:  
	http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus
	the response will be a json containing the GPS position, and some more information, of every bus

	old url: http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes
	this old url does not have bus direction on its json response
*/


var http = require('http'); // importing http module. it's a node's default module.
var fs = require('fs');	// importing filesystem module. using fs to read riobus-config.json
var zlib = require('zlib'); // importing zlib module that we will use to decompress the JSON compressed in gzip.
var moment = require('moment'); // importing moment to format date when ajusting daylight saving errors

const MAX_DELAY_TO_ADJUST = 15 * 60 * 1000 ; // 15 minutes (expressed in milliseconds)
const MIN_DELAY_TO_ADJUST = -5 * 60 * 1000 ; // -5 minutes (expressed in milliseconds)
const MILLISECONDS_IN_AN_HOUR = 60*60*1000 ;


// function that will be called when we receive a response from dadosabertos server
var httpGETCallback = function (response) {
	if (response.statusCode == 200) {
		// printing http header from the server's response
		// console.log(' - HEADERS: ' + JSON.stringify(response.headers));
		console.log('Dados recebidos em ' + Date(Date.now()));

		var json = ''; // variable that will hold the json received from dadosabertos server

		/*	registering function that will be called if there is an error on response. When response triggers 
			the 'data' event. I don't know which types of error it could be. 
		*/
		response.on('error', function(err) {
		   console.log(" - We've had this error on dadosabertos RESPONSE: " + err);
		});

		/*	in here we need to check if the response we are getting is compressed with gzip. if it is, we have to
			instantiate a gzip decompresser and pass all the data from response to this gzip decompresser.
			in the end, we set the object that will be notified by the .on('data') and .on('end') events. both
			the response and the gzip decompresser listen to these two events.
		*/
		var output; // the object that will listen for 'data' and 'end' events
		var serverTime = Date.parse(response.headers['date']);
		if (response.headers['content-encoding'] == 'gzip') { // the server tell us which kind of thing it is sending
		  var gzip = zlib.createGunzip(); // creating the gzip decompresser
		  response.pipe(gzip); // sending data from the responses (compressed) to the decompresser
		  output = gzip; // the decompresser will listen for 'data' and 'end' events
		} else {
		  output = response; //the response will listen for 'data' and 'end' events
		}

		/*	registering function that will be called at every chunk received by either the response
			or the decompresser. When the 'data' event is triggered.
		*/
		output.on('data', function (chunk) {
			json += chunk.toString('utf-8'); // appending all the chunks
		});

		/*	registering function that will be called when data is completely received.
			When the 'end' event is triggered.
		*/
		output.on('end', function () {
			try {
				// parsing all the data, read as a string, as JSON. now, it's a javascript object
				json = JSON.parse(json);
			} catch (err) {
				json = null; // if there was an error when parsing the json, it is invalid to our purpose.
				if (err instanceof SyntaxError) {
					console.log(" - we've had a syntax error while parsing json file from dadosabertos.",
								"data will be an empty object");
				} else {
					console.log(err.message);
					console.log(err.stack);		
				}
			}

			/*	If we received a message saying that our request was good but nothing has been found, we
				will not consider it as a valid response. because it means their service could not provide
				any data, which they should. As we are quering for everything, something must be provided.
			*/
			// checking if dadosabertos server gave us just a message telling us that nothing were found.
			// "COLUMNS" attribute change to an array with size 1 and its content is'MENSAGEM'.
			if (json['COLUMNS'][0] === "MENSAGEM") {
				// we don't care about the message. this is the only message in the whole service.
				console.log(" - Dadosabertos said:", json['DATA'][0][0]) // message comes inside 'DATA', nested 2 times.
				json = null; // it means this json is invalid to our purpose.
			}

			if (json !== null) { // if json is valid, keep going.
				/*	object 'data' is here to represent a simple data structure. this object will hold all the busses
					from each bus line. the bus lines in this object will be sent to the server.js thread, whenever
					it receives am http request for a bus line.
				*/
				var data = {lastUpdate: (new Date()).toUTCString()};
				/*	setting a new time at every reponse with status code 200. transforming date to a 
					readable UTC time string.*/

				/*
					data will be a hashtable/hashmap, where the key will be the bus line and the value
					will be all the busses on this line that came in the JSON response, like this:

					key 			: 	value
					lastUpdate		: 	"Sun Nov 02 2014 16:26:12 GMT-0200 (BRST)", 
					"<bus line>"	: 	[<bus info>, <bus info>, ...],
					"<bus line>"	: 	[<bus info>, <bus info>, ...],
					"<bus line>"	: 	[<bus info>, <bus info>, ...],

					where :
					lastUpdate is a date that is set at every sucessfull response we get.
					<bus info> = ["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE","DIRECAO"]
					<bus line> = "LINHA"

					I have decided to build the structure in this way because I believe this is the way we should build
					our future database. This structre makes the search for all the busses in a bus line, retrieve a
					single value from one key. This is the main operation done in the project: a search for all the busses
					from one bus line.
				*/

				// loop running backwards, according to google's recommendation for v8 engine.
				for (var i = json['DATA'].length - 1; i >= 0; i--) {
					var bus = json['DATA'][i];

					// Check for daylight saving time (DST) erros (ex: when the bus is not on DST)
					var busDate = Date.parse(bus[0]);
					var delayInSeconds = serverTime-busDate ;

					var adjusted = false ;

					// Make adjustements when delay is about an hour before or after server time
					if ( delayInSeconds >= -MILLISECONDS_IN_AN_HOUR+MIN_DELAY_TO_ADJUST && delayInSeconds <= -MILLISECONDS_IN_AN_HOUR+MAX_DELAY_TO_ADJUST ) {
						busDate -= MILLISECONDS_IN_AN_HOUR ;
						adjusted = true ;
					} else if ( delayInSeconds >= MILLISECONDS_IN_AN_HOUR+MIN_DELAY_TO_ADJUST && delayInSeconds <= MILLISECONDS_IN_AN_HOUR+MAX_DELAY_TO_ADJUST ) {
						busDate += MILLISECONDS_IN_AN_HOUR ;
						adjusted = true ;
					}

					// Log changes on date
					//console.log(bus[0] + " (" + delayInSeconds + " :: " + adjusted + ") --> " + newDate);

					// Adjust date, if needed
					if ( adjusted ) {
						bus[0] = moment(busDate).format("MM-DD-YYYY HH:mm:ss"); ;
					}

					var key = "" + bus[2]; // string that will be the key for the hashmap structure. 
					// "" + NUMBER, parses the NUMBER to a string. javascript's fastest way to parse number to string.
					if (data[key]){ // if key already exists in data structure.
						data[key].push(bus); // add this bus to this key (add bus to its respective line).
					} else { // if key doesn't exist.
						data[key] = [bus]; // instantiate an array in the key with this bus inside it.
					}
				}

				/*	printing the amount of busses in each bus line. it doesn't mean that there are this amount of
					in each bus line right now, because the time and date coul be saying that some busses were last
					seen a long time ago.
				*/ 
				// for (key in data){
				// 	console.log(key, "-",data[key].length);
				// }

				process.send({data: data}); // sending data to parent thread.

				/*	this is the part where we should store the data in a database.
					by now, we just print some shit about the response and write a json file with the data organized
					by bus line.
				*/
				// var keys = Object.keys(data); // return all the keys in our simple data structure
				// console.log(keys); // print all keys
				// console.log(" --- Number of bus lines = " + keys.length); // print the amount of keys

				/*
					writing a JSON file containing everything that is inside our data.
					- JSON.stringify(data) turns the object into string as JSON format.
					- JSON.stringify(data, null, 4) writes a JSON string with new lines 
					after commas (",") and with a paragraph size of 4 spaces
				*/
				// fs.writeFile('dataGrabbed.json', JSON.stringify(data), function (err) {
				// 	if (err) 
				// 		throw err;
				// 	console.log('It\'s saved!');
				// });
			}
		});
	} else if (response.statusCode == 'ECONNRESET') { // statusCode for when remote server close the connection on us.
		console.log(" - Dadosabertos server closed the connection");
	} else if (response.statusCode == 503) { // statusCode for when remote server is unavailable.
		console.log(" - Dadosabertos server was unavailable, code:", response.statusCode);
	} else if (response.statusCode == 404) { // statusCode for when remote server can't find request (not found).
		console.log(" - Dadosabertos server could not find anything matching our request, code:", response.statusCode);
	} else {
		console.log(" - Dadosabertos responded with statuscode:", response.statusCode);
	}
}

var intervalTime = 15000; // default intervalTime to be passed as argument in the setInterval function later on

// saved the function that sends the request in this variable, just so I can use it again inside setInterval()
var sendRequestAndGrabData = function() {

	/*
		getting the configuration of this request from a JSON file. this will help us change the server address and
		not stop the execution. we also get the intervalTime from this file.
		I'm making a syncronous read because the rest of the execution needs this information
	*/
	// reading JSON configuration file
	var config = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).dataGrabber;
	intervalTime = config.intervalTime; // setting intervalTime from its respective field from the JSON file

	// setting the minimum request information that will be needed to use on http.get() function
	var options = {
		host: config.host, // comes from JSON configuration file
		path: config.path, // comes from JSON configuration file
		headers: { // we want to get the data enconded with gzip, after lots of trial and error, this is the right order
	  		"Accept-Encoding": "gzip", // we first say it has to be compacted with gzip
			"Accept": "application/json" // then we say which format we want to receive
		} // the other header parameters seems to be useless (i could be wrong)
	};

	/*
		http.get(options, [callback]) function makes a request using method GET and calls request.end() automatically.
		I don't think we need to keep the connection alive and we don't need a body. that's why I decided for http.get()
		instead of http.request()
	*/
	var get = http.get(options, httpGETCallback); //sending a request


	// registering function that will be called if our request trigger the 'error' event
	get.on('error', function (e) { 
		console.log(' - our REQUEST has had this error: ' + e.message); //printing error message
	});

}


sendRequestAndGrabData(); // sending the request

/*
	I'm using setInterval instead of setTimeout but I don't know what is going to happen if the server takes more 
	time to respond than the interval takes to finish. I wouldn't like to send another request when the previous one 
	hasn't received a response.
*/
 var httpGetIntervalCode = setInterval(function () { // call to 'clearInterval(httpGetInterval)' stops further executions
 	// repeating the request every 15 seconds
 	sendRequestAndGrabData();	
 }, intervalTime); //intervalTime comes from the JSON configuration file