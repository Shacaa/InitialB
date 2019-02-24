/*
 * Update command.
 * Refreshes cache of given command.
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
* Updates given command file. If "all" it updates every file.
* recieves: client(class), file(string), message(class)
* returns: false (if wrong command name)
*/
function updateFile(client, file, message){
	let commandsArr = Object.keys(botInfo.commands);
	try{
		if(file === 'all'){
			for(let i = 0; i < commandsArr.length; i++){
				delete require.cache[require.resolve(`./${commandsArr[i]}.js`)];
			}
		}else if(botInfo.commands[file]){
			delete require.cache[require.resolve(`./${file}.js`)];
		}else{
			globals.sendMessage(message.channel, `${file} not found`);
			return false;
		}
		globals.botLog(client, `${file} updated`);
		globals.sendMessage(message.channel, `${file} updated`);
	}catch(err){
		console.error(err);
	}
}