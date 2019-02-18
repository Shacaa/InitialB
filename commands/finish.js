/*
 * Finish command.
 */

const botStorage = './files/botStorage.json';
const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {

	globals.editJSONwPromise(botStorage, data => {
		let obj = JSON.parse(data);
		obj.lastOnline = new Date();
		obj.isOnline = false;
		return JSON.stringify(obj);
	}).then(response => {
		console.log(response);
		globals.botLog(client, 'Bot finished with exit code 0');
		process.exit(0);
	}).catch(err => {
		console.error(err);
		globals.botLog(client, 'Bot finished with exit code 1');
		process.exit(1);
	});
	client.destroy();

};
