/*
 * Help command.
*/

const initialbCommands = './files/initialbCommands.txt';
const fs = require('fs');


exports.run = (client, reddit, spotify, message, args) => {
	
	fs.readFile(initialbCommands, 'utf8', function(err, data){
		if(err){console.log(err);}else{message.channel.send({embed:{title:'Commands', color:10477034, description:data, footer:{text:'*Server needs a #musicshare/#music-share channel.'}}});}
	});

};
