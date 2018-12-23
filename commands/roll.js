/*
 * Roll command.
 */


exports.run = (client, reddit, spotify, message, args) => {

	roll(args[0], message);
	
	
//////////////////FUNCTIONS/////////////////////
	

	/*
	 * Sends random nuber between 0 and given number (10 if none is given).
	 * recieves: number(string), message(object)
	 * returns:
	 */
	function roll(number, message){
		var max = 10;
		if(!isNaN(number) && number > 0){
			max = number;
		}
		var res = Math.floor((Math.random()*max)+1);
		message.channel.send(res.toString());
	}
};
