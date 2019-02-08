/*
 * Finish command.
 */

const botStorage = './files/botStorage.json';
const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {
	
	globals.editJSON(botStorage, function(data){
		let obj = JSON.parse(data);
		obj.lastOnline = new Date();
		obj.isOnline = false;
		return JSON.stringify(obj);
	});
	client.destroy();

};
