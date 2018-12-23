/*
 * About command.
 */

const version = '2.0.1';
const initialbAbout = './files/initialbAbout.txt';
const fs = require('fs');


exports.run = (client, reddit, spotify, message, args) => {
	
	fs.readFile(initialbAbout, 'utf8', function(err, data){
		if(err){console.log(err);}else{message.channel.send({embed:{title:'InitialB '+version, color:10477034, description:data, footer:{text:'\'+-changelog\' for full changelog.'}}});}
	});	

};
