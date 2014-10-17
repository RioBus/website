setInterval(function (argument) {
	console.log('Server doing stuff')
},2000)

var fork = require('child_process').fork,
	child = fork(__dirname + "/dataGrabber.js");

// module express could enter here

