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
		process.exit(0);
	}).catch(err => {
		console.error(err);
		process.exit(1);
	});
	client.destroy();

};
