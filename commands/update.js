/*
 * Update command.
 * Refreshes cache of given command.
 */

const owner = '116758923603738625';

exports.run = (client, reddit, spotify, message, args) => {

	if(message.author.id != owner){
		return false;
	}
	try{
		delete require.cache[require.resolve(`./${args[0]}.js`)];
		console.log(`command ${args[0]} updated`);
		message.channel.send(`command ${args[0]} updated`);
	}catch(err){
		console.error(err);
	}
	
};
