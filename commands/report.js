/*
 * Report command.
 */

const globals = require('./globals.js');
const botInfo = require('../files/botInfo.json');

exports.run = (client, reddit, spotify, message, args) => {
	
	let msg = args.join(' ');
	globals.sendDm(client, botInfo.owner.id, '----\nServer: '+message.guild.name+' - '+message.guild.id+'\nUser: '+message.author.username+' - '+message.author.id+'\nMessage: '+msg);

	
};
