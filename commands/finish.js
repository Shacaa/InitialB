/*
 * Finish command. Terminates discord bot, cancels all scheduled jobs, terminates node process.
 */

const botStorage = './files/botStorage.json';
const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {

	globals.cancelAllScheduledJobs();

	client.destroy();

	globals.editJSONwPromise(botStorage, data => {
		let obj = JSON.parse(data);
		obj.lastOnline = new Date();
		obj.isOnline = false;
		return JSON.stringify(obj);
	}).then(response => {
		console.log(response);
		globals.dateTime('Bot finished with exit code 0');
		process.exitCode = 0;
	}).catch(err => {
		console.error(err);
		globals.dateTime('Bot finished with exit code 1');
		process.exitCode = 1;
	});


};
