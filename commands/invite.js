/*
 * Invite command.
 */

const botTokens = require('../files/botTokens.json');
const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {
	
	globals.sendMessage(message.channel, 'Follow this link to invite me to your server:\n'+botTokens.discord.invite);
	
};
