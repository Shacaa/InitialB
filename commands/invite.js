/* Copyright (c) 2019 Shacaa
 * MIT License: https://github.com/Shacaa/InitialB/blob/master/LICENSE.txt
 *
 */

const botInfo = require('../files/botInfo.json');
const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {
	
	globals.sendMessage(message.channel, 'Follow this link to invite me to your server:\n'+botInfo.discord.invite);
	
};
