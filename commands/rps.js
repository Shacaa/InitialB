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
		rpsPlay(message.author.id, args[0], message);
	}


//////////////////FUNCTIONS/////////////////////


	/*
	 * Picks a random move and sends the results depending the user's move.
	 * recieves: author's id(string), user's move(string), message(object)
	 * returns:
	 */
	function rpsPlay(author, umove, message){
		let moves = ['What does \"'+umove+'\" means!?', 'Rock', 'Paper', 'Scissors'];
		let move = moves[Math.floor((Math.random()*3)+1)];
		umove = umove.charAt(0).toUpperCase()+umove.slice(1);
		if(!moves.includes(umove)){
			message.channel.send(moves[0]);
		}else{
			if(umove === move){
				message.channel.send(move+'\nIt\'s a tie!');
				globals.editJSON(botStorage, saveWLrps, [author, false, true]);
			}else if((umove === 'Rock' && move === 'Scissors')||(umove === 'Paper' && move === 'Rock')||(umove === 'Scissors' && move === 'Paper')){
				message.channel.send(move+'\nYou win :(');
				globals.editJSON(botStorage, saveWLrps, [author, true, false]);
			}else{
				message.channel.send(move+'\nI win!');
				globals.editJSON(botStorage, saveWLrps, [author, false, false]);
			}
		}
	}


	/*
	 * Sends bot and user's win and losses porcentage ratio of rps matches.
	 * recieves: authorId(string), message(Message object)
	 * returns:
	*/
	function rpsStats(author, message){
		fs.readFile(botStorage, 'utf8', function(err, data){
			if(err){console.log(err);}else{
				obj = JSON.parse(data);
				let users = Object.keys(obj.rps);
				if(!users.includes(author)){
					message.channel.send('You have never played rps with me, what a boring person...');
				}else{
					let us = obj.rps[author];
					let usT = us[0]+us[1]+us[2];
					let bs = obj.rps['InitialB'];
					let bsT = bs[0]+bs[1]+bs[2];
					message.channel.send('---'+message.author.username+'---\nWins: '+((Math.round(((us[0]*100)/usT)*100))/100).toString()+'%\nLosses: '+((Math.round(((us[1]*100)/usT)*100))/100).toString()+'%\n---InitialB---\nWins: '+((Math.round(((bs[0]*100)/bsT)*100))/100).toString()+'%\nLosses: '+((Math.round(((bs[1]*100)/bsT)*100))/100).toString()+'%');
				}
			}
		});
	}


	/*
	 * Saves the rps match result into bot and users's stats.
	 * recieves: authorId(string), win(boolean), tie(boolean), rps stats data(stringify json)
	 * returns: new stringify json(string)
	*/
	function saveWLrps(author, win, tie, data){
		let obj = JSON.parse(data);
		let users = Object.keys(obj.rps);
		if(!users.includes(author)){
			obj.rps[author] = [0,0,0];
			console.log('se agrego nuevo usuario');
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
};
