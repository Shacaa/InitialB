/*
 * About command.
 */

const initialbAbout = './files/initialbAbout.txt';
const botInfo = require('../files/botInfo.json');
const globals = require('./globals.js');
const fs = require('fs');


exports.run = (client, reddit, spotify, message, args) => {
	
	fs.readFile(initialbAbout, 'utf8', function(err, data){
		if(err){console.log(err);}else{
			globals.sendMessage(message.channel, {embed:{title:'InitialB '+botInfo.version, color:10477034, description:data}});
		}
	});	

};
