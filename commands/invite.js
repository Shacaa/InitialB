/*
 * Invite command.
 */

const botTokens = require('../files/botTokens.json');


exports.run = (client, reddit, spotify, message, args) => {
	
	message.channel.send('Follow this link to invite me to your server:\n'+botTokens.discord.invite);
	
};
