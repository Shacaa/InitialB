/* Copyright (c) 2019 Shacaa
 * MIT License: https://github.com/Shacaa/InitialB/blob/master/LICENSE.txt
 *
 */

const globals = require('./globals.js');
const botInfo = require('../files/botInfo.json');


exports.run = (client, reddit, spotify, message, args) => {

	if(message.author.id !== botInfo.owner.id){
		return false;
	}
	updateFile(client, args[0], message);
	
};


/*
* "commands" updates all files set in botInfo.commands.
* "files" updates all files set in botInfo.files.
* "project" updates commands and files.
* "<file>" updates given file directory (has to be inside the project).
* recieves: client(class), file(string), message(class)
* returns:
*/
function updateFile(client, file, message){
	try{
		if(file === 'commands' || file === 'project'){
			let commands = Object.keys(botInfo.commands);
			for(let i = 0; i < commands.length; i++){
				delete require.cache[require.resolve(`./${commands[i]}.js`)];
			}
		}else if(file === 'files' || file === 'project'){
			let files = Object.keys(botInfo.files);
			for(let i = 0; i < files.length; i++){
				delete require.cache[require.resolve(`../files/${files[i]}`)];
			}
		}else{
			delete require.cache[require.resolve(`../${file}`)];
		}
		globals.botLog(client, `${file} updated`);
		globals.sendMessage(message.channel, `${file} updated`);
	}catch(err){
		globals.sendMessage(message.channel, 'file not found');
		console.error(err);
	}
}



