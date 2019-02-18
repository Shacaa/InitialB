/*
 * Rock, Paper, Scissors.
 */


const botStorage = './files/botStorage.json';
const fs = require('fs');
const globals = require('./globals.js');


exports.run = (client, reddit, spotify, message, args) => {

	if(args[0] === 'stats'){
		rpsStats(message.author.id, message);
	}else if(args[0]){
		rpsPlay(client, message.author.id, args[0], message);
	}

};




/*
 * Picks a random move and sends the results depending the user's move.
 * recieves: author's id(string), user's move(string), message(object)
 * returns:
 */
function rpsPlay(client, author, umove, message){
	let moves = ['What does \"'+umove+'\" means!?', 'Rock', 'Paper', 'Scissors'];
	let move = moves[Math.floor((Math.random()*3)+1)];
	umove = umove.charAt(0).toUpperCase()+umove.slice(1);
	if(!moves.includes(umove)){
		globals.sendMessage(message.channel, moves[0]);
	}else{
		if(umove === move){
			globals.sendMessage(message.channel, move+'\nIt\'s a tie!');
			globals.editJSON(botStorage, saveWLrps, [client, author, false, true]);
		}else if((umove === 'Rock' && move === 'Scissors')||(umove === 'Paper' && move === 'Rock')||(umove === 'Scissors' && move === 'Paper')){
			globals.sendMessage(message.channel, move+'\nYou win :(');
			globals.editJSON(botStorage, saveWLrps, [client, author, true, false]);
		}else{
			globals.sendMessage(message.channel, move+'\nI win!');
			globals.editJSON(botStorage, saveWLrps, [client, author, false, false]);
		}
	}
}


/*
 * Sends bot and user's win rate of rps matches.
 * recieves: authorId(string), message(class)
 * returns:
*/
function rpsStats(author, message){
	fs.readFile(botStorage, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			let users = Object.keys(obj.rps);
			if(!users.includes(author)){
				globals.sendMessage(message.channel, 'You have never played rps with me, what a boring person...');
			}else{
				let us = obj.rps[author];
				let usT = us[0]+us[1]+us[2];
				let bs = obj.rps['InitialB'];
				let bsT = bs[0]+bs[1]+bs[2];
				globals.sendMessage(message.channel, '---'+message.author.username+'---\nWins: '+((Math.round(((us[0]*100)/usT)*100))/100).toString()+'%\nLosses: '+((Math.round(((us[1]*100)/usT)*100))/100).toString()+'%\n---InitialB---\nWins: '+((Math.round(((bs[0]*100)/bsT)*100))/100).toString()+'%\nLosses: '+((Math.round(((bs[1]*100)/bsT)*100))/100).toString()+'%');
			}
		}
	});
}


/*
 * Saves the rps match result into bot and users's stats.
 * recieves: authorId(string), win(boolean), tie(boolean), rps stats data(stringify json)
 * returns: new stringify json(string)
*/
function saveWLrps(client, author, win, tie, data){
	let obj = JSON.parse(data);
	let users = Object.keys(obj.rps);
	if(!users.includes(author)){
		obj.rps[author] = [0,0,0];
		globals.botLog(client, 'New user added to rps - ' + author);
	}
	if(win){
		obj.rps[author][0]++;
		obj.rps['InitialB'][1]++;
	}else if(tie){
		obj.rps[author][2]++;
		obj.rps['InitialB'][2]++;
	}else{
		obj.rps[author][1]++;
		obj.rps['InitialB'][0]++;
	}
	return JSON.stringify(obj);
}
