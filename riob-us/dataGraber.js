/*
	We will perform a GET resquest, for all the busses, to dadosaberto.rio.gov.br
*/

var http = require('http');

/*	we have to send a GET request using this url:  
	http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus
	the response will be a json containing the GPS position of every bus
*/
var options = {
  host: 'dadosabertos.rio.rj.gov.br',
  path: '/apiTransporte/apresentacao/rest/index.cfm/onibus',
  headers: {
  		'Content-Type': "application/json",
  		'Accept': "*/*",
  }
};

var request = http.get(options, function(response) {
	console.log('STATUS: ' + response.statusCode);
	console.log('HEADERS: ' + JSON.stringify(response.headers));
	response.setEncoding('utf8');

	var json = '';

	response.on('data', function (chunk) {
		json += chunk;
	});

	response.on('end', function () {
		json = JSON.parse(json);

		var data = [];

		for (var i = json['DATA'].length - 1; i >= 0; i--) {
			if (data["/" + json['DATA'][i][2]]){
				data["/" + json['DATA'][i][2]].push(json['DATA'][i]);
			} else {
				data["/" + json['DATA'][i][2]] = [];
				data["/" + json['DATA'][i][2]].push(json['DATA'][i]);
			}
			
		}


		for (key in data) {
			console.log(key);
		}

		console.log("Size = " + Object.keys(data).length);
	})
});

request.on('error', function (e) {
	console.log('problem with request: ' + e.message);
});
