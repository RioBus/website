/*	things to do in this code
	1- keep updating comments as code changes.
This way, we don't need to restart the code if those things change.
	2- delete comments that print information that is useless for this code. number of bus lines, busses and chunks.
This kind of information is useful for someone else, somewhere else, but not here, not for this code.
	3- add code that will store the JSON data, from the response, in a database
*/


/*
	We will perform a GET resquest, for all the busses, to dadosaberto.rio.gov.br

	we have to send a GET request to this url:  
	http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus
	the response will be a json containing the GPS position, and some more information, of every bus

	old url: http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes
	this old url does not have bus direction on its json response
*/


var http = require('http'); // importing http module. it's a node's default module
var fs = require('fs');	// importing filesystem module. Required to wrie files.


var time_endOfRequest, time_endOfResponseMoment, time_endResponseHeader;

// function that will be called when we receive a response from dadosabertos server
var httpGETCallback = function (response) {
	time_endResponseHeader = (new Date()).getTime();
	console.log(" >>> Response header took " + (time_endResponseHeader - time_endOfRequest) + " miliseconds to arrive")

	console.log('STATUS: ' + response.statusCode); // printing http status code from the server's response 
	console.log('HEADERS: ' + JSON.stringify(response.headers)); // printing http header from the server's response
	// these two prints are not necessary, but this is the place to check for status codes that differ from '200' 
	response.setEncoding('utf8'); // I don't know if it's really necessary to setEnconding to uf8... but it's here anyway
	


	var json = ''; // variable that will hold the json received from dadosabertos server
	var chunksCounter = 0; // chunk counter, just to see how things work...

	// registering function that will be called at every chunk received. When response triggers the 'data' event
	response.on('data', function (chunk) {
		json += chunk; // appending all the chunks
		chunksCounter++; // couting one more chunk to this response
	});


	// registering function that will be called when data is completely received. When response triggers the 'end' event
	response.on('end', function () {
		console.log(" --- there were " + chunksCounter + " chunks in this response"); // printing number of chunks 
		time_endOfResponseMoment = (new Date()).getTime();
		console.log("Server took " + (time_endOfResponseMoment - time_endOfRequest) + " miliseconds to finish the response")

		json = JSON.parse(json); // parsing all the data, read as a string, as JSON. now, it's a javascript object
		console.log("There are " + json['DATA'].length + " buss' GPS's on-line")

		var data = {}; // variable that is here to represent a simple data structure
		/*
			data will be a hashtable/hashmap, where the key will be the bus line and the value
			will be all the busses on this line that came in the JSON response, like this:

			key 			: 	value 
			"<bus line>"	: 	[<bus info>, <bus info>, ...]

			where <bus info> = ["DATAHORA","ORDEM","LINHA","LATITUDE","LONGITUDE","VELOCIDADE","DIRECAO"]
			and <bus line> = "LINHA"

			I have decided to build the structure in this way because I believe this is the way we should build our
			future database. This structre makes the search for all the busses in a bus line, retrieve a single value
			from one key. This is the main operation done in the project: a search for all the busses from one bus line.
		*/

		// loop running backwards, according to v8's engine recommendation
		for (var i = json['DATA'].length - 1; i >= 0; i--) {
			var key = "" + json['DATA'][i][2]; // string that will be the key for the hash structure. 
			// "" + INTEGER, parses the INTEGER to a string. javascript's fastest way parse from integer to string.
			if (data[key]){ // if key already exists in data structure
				data[key].push(json['DATA'][i]); // add this bus to this key (add bus to its respective line)
			} else { // if key doesn't exist
				data[key] = []; // instantiate an array in the key
				data[key].push(json['DATA'][i]); // add this bus to this key (add bus to its respective line)
			}
		}

		/*
			this is the part where we should store the data in a database.
			by now, we just print some shit about the response and write a json file with the data organize by bus line
		*/
		var keys = Object.keys(data); // return all the keys in our simple data structure
		// console.log(keys); // print all keys
		console.log(" --- Number of bus lines = " + keys.length); // print the amount of keys

		/*
			writing a JSON file containing everything that is inside our data.
			- JSON.stringify(data) turns the object into string as JSON format.
			- JSON.stringify(data, null, 4) writes a JSON string with new lines 
			after commas (",") and with a paragraph size of 4 spaces
		*/
		fs.writeFile('dataGrabbed.json', JSON.stringify(data), function (err) {
			if (err) 
				throw err;
			console.log('It\'s saved!');
		});
	});
}

var intervalTime = 15000; // default intervalTime to be passes as argument in the setInterval function later on

// saved the function that sends the request in a variable, just so I can use it again inside setInterval()
var sendRequestAndWriteResponse = function() {

	/*
		getting the configuration of this request from a JSON file. this will help us change the server address and
		not stop the execution. we also get the intervalTime from this file.
		I'm making a syncronous read because the rest of the execution needs this information
	*/
	var config = JSON.parse(fs.readFileSync("dataGabberCondfig.json")); // reading JSON configuration file
	intervalTime = config["intervalTime"]; // setting intervalTime from its respective field from the JSON file

	// setting the minimum request information that will be needed to use on http.get() function
	var options = {
		host: config["host"], // came from JSON configuration file
		path: config["path"], // came from JSON configuration file
		headers: {	// all the other header values don't seem to make a difference on the response we get
	  		// 'Content-Type': "application/json",
	  		'Accept':"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", // this is probably the most important
	  		'Accept-Enconding': "gzip,deflate",
	  		'Connection': "keep-alive",
	  		'Cache-Control': "no-cache",
	  		'User-Agent':"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:28.0) Gecko/20100101 Firefox/28.0"
		}
	};

	/*
		http.get(options, [callback]) function makes a request using method GET and calls request.end() automatically.
		I don't think we need to keep the connection alive and we don't need a body. that's why I decided for http.get()
		instead of http.request()
	*/
	var get = http.get(options, httpGETCallback); //sending a request
	console.log("Request Sent")
	time_endOfRequest = (new Date()).getTime();


	// registering function that will be called if our request trigger the 'error' event
	get.on('error', function (e) { 
		console.log('problem with request: ' + e.message); //printing error message
	});
}


sendRequestAndWriteResponse(); // sending the request

/*
	I'm using setInterval instead of setTimeout but I don't know what is going to happen if the server takes more 
	time to respond than the interval takes to finish. I wouldn't like to send another request when the previous one 
	hasn't received a response.
*/
 var httpGetInterval = setInterval(function () { // clearInterval(httpGetInterval) can be used to stop further executions
 	// repeating the request every 15 seconds
 	sendRequestAndWriteResponse();	
 }, intervalTime); //intervalTime comes from the JSON configuration file
