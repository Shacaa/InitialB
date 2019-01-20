/*
 * Report command.
 */

const globals = require('./globals.js');
const owner = '116758923603738625';

exports.run = (client, reddit, spotify, message, args) => {
	
	let msg = args.join(' ');
	globals.sendDm(client, owner, '----\nServer: '+message.guild.name+' - '+message.guild.id+'\nUser: '+message.author.username+' - '+message.author.id+'\nMessage: '+msg);

	
};
