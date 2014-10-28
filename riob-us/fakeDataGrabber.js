var fs = require('fs');

var intervalTime = 2000;

var buildAndSendData = function () {
	var config = JSON.parse(fs.readFileSync("dataGabberCondfig.json"));
	intervalTime = config["intervalTime"];

	process.send({data: JSON.parse(fs.readFileSync("dataGrabbed.json"))});
	console.log("data object has been created and sent");
};

buildAndSendData();

var intervalCode = setInterval(function () { // clearInterval(intervalCode) can be used to stop further executions
 	// repeating the request every 15 seconds
 	buildAndSendData();	
 }, intervalTime); //intervalTime comes from the JSON configuration file