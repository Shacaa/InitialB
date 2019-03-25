/* Copyright (c) 2019 Shacaa
 * MIT License: https://github.com/Shacaa/InitialB/blob/master/LICENSE.txt
 *
 */

const initialbCommands = './files/initialbCommands.txt';
const globals = require('./globals.js');
const fs = require('fs');


exports.run = (client, reddit, spotify, message, args) => {
	
	fs.readFile(initialbCommands, 'utf8', function(err, data){
		if(err){console.log(err);}else{
			globals.sendMessage(message.channel, {embed:{title:'Commands', color:10477034, description:data, footer:{text:'*Server needs a #musicshare/#music-share channel.'}}});
		}
	});

};
