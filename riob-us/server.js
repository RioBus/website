var fork = require('child_process').fork,
	child = fork(__dirname + "/dataGrabber.js");

/*	function that will be executed when this thread receives a message from its child thread.
*/
child.on('message', function (message) {
	console.log(message);
});

setInterval(function () {
	child.send({busLine: "485"}); // sending a message to child process, asking for all busses in this bus line
	// child process is expecting the field 'busLine', as a string, as an attribute of the message object
},3000)





