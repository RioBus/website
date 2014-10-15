/*
	We will perform a GET resquest, for all the busses, to dadosaberto.rio.gov.br
*/

var http = require('http'); // importing http module. it's a node's default module

/*	we have to send a GET request using this url:  
	http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus
	the response will be a json containing the GPS position of every bus

	old url: http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes
*/

// setting the minimum request information that will be need to use on http.get() function
var options = {
  host: 'dadosabertos.rio.rj.gov.br',
  path: '/apiTransporte/apresentacao/rest/index.cfm/onibus',
  headers: {	// all the other header values don't seem to make a difference on the response we get
  		'Content-Type': "application/json",
  		'Accept': "*/*",
  }
};

/*
	http.get(options, [callback]) function makes a request using method GET and calls request.end() automatically.
	I don't think we need to keep the connection alive and we don't need a body. that's why I decided for http.get()
	instead of http.request()
*/
var get = http.get(options, function(response) {
	console.log('STATUS: ' + response.statusCode); // printing http status code from the server'sresponse 
	console.log('HEADERS: ' + JSON.stringify(response.headers)); // printing http header from the server's response
	// these two prints are not necessary, but this is the place to check for status codes that differ from '200' 
	response.setEncoding('utf8'); // I don't know if it's really necessary to setEnconding to uf8... but it's here anyway

	var json = ''; // variable that will hold the json received from dadosabertos server

		
	// registering function that will be called at every chunk received. When response triggers the 'data' event
	response.on('data', function (chunk) {
		json += chunk; //appending all the chunks
	});


	// registering function that will be called when data is completely received. When response triggers the 'end' event
	response.on('end', function () {
		json = JSON.parse(json); // parsing all the data, read as a string, as JSON. now, it's a javascript object

		var data = []; // variable that is here to represent a simple data structure
		/*
			data will be a hashtable/hashmap like this 
			key 			: 	value 
			"/<bus line>"	: 	[[<bus info>], [<bus info>], ...]
		*/

		// loop running backwards, according to v8's engine recommendation
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
		console.log(keys); // print all keys
		console.log("Number of bus lines = " + keys.length); // print the amount of keys
	});
});

// registering function that will be called if request trigger the 'error' event
get.on('error', function (e) { 
	console.log('problem with request: ' + e.message); //printing error message
});
