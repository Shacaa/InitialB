/*
 * Roll command.
 */

const globals = require('./globals.js');

exports.run = (client, reddit, spotify, message, args) => {

	roll(args[0], message);

};




/*
 * Sends random nuber between 0 and given number (10 if none given).
 * recieves: number(string), message(class)
 * returns:
 */
function roll(number, message){
	let max = 10;
	if(!isNaN(number) && number > 0){
		max = number;
	}
	let res = Math.floor((Math.random()*max)+1);
	globals.sendMessage(message.channel, res.toString());
}
