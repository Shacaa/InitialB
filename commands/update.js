/*
 * Update command.
 * Refreshes cache of given command.
 */

const owner = '116758923603738625';
const commands = [
	"about",
	"event",
	"finish",
	"help",
	"invite",
	"musicshare",
	"reddit",
	"report",
	"roll",
	"rps",
	"spotify",
	"testC",
	"update",
	"debug",
	"ohoho"
];

exports.run = (client, reddit, spotify, message, args) => {

	if(message.author.id !== owner){
		return false;
	}
	updateFile(args[0], message);
	
};


/*
* Updates given command file. If "all" it updates every file.
* recieves: file(string), message(class)
* returns:
*/
function updateFile(file, message){
	try{
		if(file === 'all'){
			for(let i = 0; i < commands.length; i++){
				delete require.cache[require.resolve(`./${commands[i]}.js`)];
			}
		}else{
			delete require.cache[require.resolve(`./${file}.js`)];
		}
		console.log(`${file} updated`);
		message.channel.send(`${file} updated`);
	}catch(err){
		console.error(err);
	}
}