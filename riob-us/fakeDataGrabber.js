var fs = require('fs');

var intervalTime = 15000;

var buildAndSendData = function () {
	intervalTime = JSON.parse(fs.readFileSync(__dirname + "/riobus-config.json")).dataGrabber.intervalTime;

	try {
		process.send({data: JSON.parse(fs.readFileSync(__dirname + "/dataGrabbed.json"))});
		JSON.parse(fs.readFileSync(__dirname + "/dataGrabbed.json"))
		console.log(" - data object has been sent to parent process");
	} catch (er) {
		if (er instanceof SyntaxError) {
			console.log("we've had a syntax error while reading file");
		} else {
			console.log(er.stack);
		}
	} finally {
		json = {}
	}
	
};

buildAndSendData();

var intervalCode = setInterval(function () { // clearInterval(intervalCode) can be used to stop further executions
	// repeating the request every 15 seconds
	buildAndSendData();
}, intervalTime); //intervalTime comes from the JSON configuration file