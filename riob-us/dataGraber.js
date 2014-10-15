/*
	We will perform a GET resquest, for all the busses, to dadosaberto.rio.gov.br
*/

var http = require('http'); // importing http module. it's a node's default module

/*	we have to send a GET request to this url:  
	http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus
	the response will be a json containing the GPS position, and some more information, of every bus

	old url: http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes
	this old url does not have bus direction on its json response
*/

// setting the minimum request information that will be needed to use on http.get() function
var options = {
  host: 'dadosabertos.rio.rj.gov.br',
  path: '/apiTransporte/apresentacao/rest/index.cfm/onibus',
  headers: {	// all the other header values don't seem to make a difference on the response we get
  		'Content-Type': "application/json",
  		'Accept': "*/*",
  }
};

// function that will be called when we receive a response from dadosabertos server
var httpGETCallback = function (response) {
	console.log('STATUS: ' + response.statusCode); // printing http status code from the server'sresponse 
	console.log('HEADERS: ' + JSON.stringify(response.headers)); // printing http header from the server's response
	// these two prints are not necessary, but this is the place to check for status codes that differ from '200' 
	response.setEncoding('utf8'); // I don't know if it's really necessary to setEnconding to uf8... but it's here anyway

	var json = ''; // variable that will hold the json received from dadosabertos server
	var chunks = 0; // chunk counter, just to see how things work...
	// registering function that will be called at every chunk received. When response triggers the 'data' event
	response.on('data', function (chunk) {
		json += chunk; // appending all the chunks
		chunks++; // couting one more chunk to this response
	});


	// registering function that will be called when data is completely received. When response triggers the 'end' event
	response.on('end', function () {
		console.log(" --- there were " + chunks + " chunks in this response"); // printing number of chunks 
		json = JSON.parse(json); // parsing all the data, read as a string, as JSON. now, it's a javascript object

		var data = []; // variable that is here to represent a simple data structure
		/*
			data will be a hashtable/hashmap like this 
			key 			: 	value 
			"/<bus line>"	: 	[[<bus info>], [<bus info>], ...]
		*/

		// loop running backwards, according to v8's engine recommendation
		console.log("There are " + json['DATA'].length + " busses on-line")
		for (var i = json['DATA'].length - 1; i >= 0; i--) {
			var key = "/" + json['DATA'][i][2]; // string that will be the key for the hash structure
			if (data[key]){ // if key already exists in data structure
				data[key].push(json['DATA'][i]); // add this bus to this key (add bus to its respective line)
			} else { // if key doesn't exist
				data[key] = []; // instance an array in the key
				data[key].push(json['DATA'][i]); // add this bus to this key (add bus to its respective line)
			}
		}

		/*
			this is the part where we should store the data in a database or file.
			by now, we just print what we get, just so we can see the server is actually responding some stuff
		*/
		var keys = Object.keys(data); // return all the keys in our simple data structure
		// console.log(keys); // print all keys
		console.log(" --- Number of bus lines = " + keys.length); // print the amount of keys
	});
}

// saved the function that sends the request in a variable, just so I can use it again inside setInterval()
var sendRequest = function() {
	/*
		http.get(options, [callback]) function makes a request using method GET and calls request.end() automatically.
		I don't think we need to keep the connection alive and we don't need a body. that's why I decided for http.get()
		instead of http.request()
	*/
	var get = http.get(options, httpGETCallback); //sending a request

	// registering function that will be called if our request trigger the 'error' event
	get.on('error', function (e) { 
		console.log('problem with request: ' + e.message); //printing error message
	});
}

sendRequest(); // sending the request

/*
	I'm using setInterval instead of setTimeout but I don't know what is going to happen if the server takes more 
	time to respond than the interval takes to finish. I wouldn't like to send another request when the previous one 
	hasn't received a response.
*/
 var httpGetInterval = setInterval(function () { // clearInterval(httpGetInterval) can be used to stop further executions
 	// repeating the request every 15 secondsç
 	sendRequest();	
 }, 15000); //interval set to 15 seconds
