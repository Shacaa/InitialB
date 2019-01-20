/*
 * Musicshare command.
 */

const musicShareDb = './files/musicShareDb.json';
const botStorage = './files/botStorage.json';
const fs = require('fs');
const globals = require('./globals.js');


exports.run = (client, reddit, spotify, message, args) => {
	
	if(args[0] === 'processMsChannels'){
		fs.readFile(botStorage, 'utf8', function(err, data){
			if(err){console.error(err);}else{
				let obj = JSON.parse(data);
				let lastOnline = new Date(obj.lastOnline);
				checkMusicShare(lastOnline);
			}
		});
	}else if((args[0] === 'message') || (args[0] === 'add')){
		let linkIds = getYtSpLinkId(message.content);
		if(linkIds[0]){
			globals.botLog(client, linkIds);
			let ids = [];
			for(let i = 0; i < linkIds.length; i++){
				ids.push([linkIds[i], message.author.id, message.guild.id]);
			}
			globals.editJSON(musicShareDb, saveEntryMusicDb, [message , ids, true]);
		}
	}else{
		let mentions = message.mentions.members.array();
		let from = 'server';
		if(args[0] === 'all'){
			from = 'all';
		}else if(mentions.length > 0){
			from = mentions[0].user.id +' '+mentions[0].user.username;
		}
		sendRandomEntryMusicDb(message.author.id, message.channel, message.guild.id, from);
	}


///////////////////FUNCTIONS////////////////////////


	//https://www.youtube.com/playlist?list=PLWlR09a6mhaRi4Z40tCGNZtstzTzAD-cO
	/*
	 * Gets the youtube or spotify link id's from a string.
	 * recieves: message(string)
	 * returns: link id(array:[id]), or false if there is no link(array:[false])
	*/
	function getYtSpLinkId(msg){
		let words = msg.split(/ |\n/);
		let ytTemplate = /(https:\/\/(www\.)?youtu\.?be)/;
		let sptTemplate = /(https:\/\/open.spotify.com\/((track)|(album)))/;
		let link = [false];
		let id;
		for(let i in words){
			if(ytTemplate.test(words[i])){
				if((/https:\/\/youtu.be/).test(words[i])){
					id = words[i].split('/')[3];
				}else{
					id = words[i].split('v=')[1];
					if(!id){continue;}
				}
				link.push((id.split('&')[0]).split('?')[0]);
				if(!link[0]){link.shift();}
			}else if(sptTemplate.test(words[i])){
				let linkParts = words[i].split('/');
				id = linkParts[3]+'/'+linkParts[4];
				link.push(id.split('?si=')[0]);
				if(!link[0]){link.shift();}
			}
		}
		return link;
	}


	/*
	 * Goes through all the #musicshare channels in all the guilds the bot is to check old messages.
	 * recieves: lastOnline(Date)
	 * returns:
	 */
	function checkMusicShare(lastOnline){
		let guilds = client.guilds.array();
		for(let i = 0; i < guilds.length; i++){
			let channels = guilds[i].channels.array();
			for(let j = 0; j < channels.length; j++){
				if((/music-?share/).test(channels[j].name)){
					processMsgMusicShare(channels[j], lastOnline);
				}
			}
		}
		
	}


	/*
	 * Checks old messages in a channel that were posted since last time the bot was online.
	 * If a message contains a yt/spotify link it will save it to the musicShareDb.
	 * recieves: channel(Class object), lastOnline(Date), offset(message id - snowflake), saved(int)
	 * returns: 
	 */
	function processMsgMusicShare(channel, lastOnline, offset = false, toSave = []){
		let options = {'limit':100};
		if(offset){options['before'] = offset;}
		channel.fetchMessages(options).then(function(data){
			let messages = data.array();
			let i = 0;
			for(i; i < messages.length; i++){
				if(messages[i].createdAt.getTime() < lastOnline.getTime()){
					break;
				}else if(messages[i].author.bot){
					continue;
				}
				let linkIds = getYtSpLinkId(messages[i].content);
				if(linkIds[0]){
					console.log(linkIds);
					for(let l = 0; l < linkIds.length; l++){toSave.push([linkIds[l], messages[i].author.id, messages[i].guild.id]);}
				}
			}
			if(i === 100){processMsgMusicShare(channel, lastOnline, messages[i-1].id, toSave);}else{
				if(toSave.length > 0){
					globals.editJSON(musicShareDb, saveEntryMusicDb, [channel, toSave, false]);
					let text = ' songs';
					if(toSave.length === 1){text = ' song';}
					// channel.send(toSave.length.toString()+text+' saved since last time I was online.\nYou can use \"+-musicshare\" to get a random song.').then(function(data, err){
					// 	if(err){console.error(err);}else{
					// 		data.delete(60000);
					// 	}
					// });
					globals.editJSON(botStorage, function(data){
						let obj = JSON.parse(data);
						obj.lastOnline = new Date();
						return JSON.stringify(obj);
					});
				}
			}
		});
	}


	/*
	 * Saves link in the user's music data base. If notify it will notify the action in the channel.
	 * recieves: message(object), linkId(string), notify(boolean), json(string)
	 * returns: new stringify json(string)
	*/
	//[linkid, authorid, guildid]
	function saveEntryMusicDb(message, toSave, notify, data){
		let obj = JSON.parse(data);
		let saved = 0;
		console.log(toSave);
		for(let i = 0; i < toSave.length; i++){
			let author = toSave[i][1];
			let serverId = toSave[i][2];
			if(obj['servers'][serverId]['ids'][toSave[i][0]]){
				console.log('salteo');
				continue;
			}
			if(!obj['servers'][serverId][author]){
				obj['servers'][serverId][author] = [];
				console.log('New user added to '+serverId);
			}
			obj['servers'][serverId][author].push(toSave[i][0]);
			obj['servers'][serverId]['ids'][toSave[i][0]] = [];
			if(!obj['ids'][toSave[i][0]]){obj['ids'][toSave[i][0]] = [];}
			saved++;
		}
		//let permissions = message.channel.permissionsFor(client.user);
		if(notify && saved > 0){
			//You can use "+-musicshare" to get a random song.
			//You can use "+-musicshare" to get a random song. \n Go subscribe to Pewdiepie! :punch:
			message.channel.send('Your music has been saved!\nYou can use "+-musicshare" to get a random song.\n Go subscribe to Pewdiepie! :punch:' ).then(function(data, err){
				if(err){console.error(err);}else{
					data.delete(30000);
				}
			});
		}
		return JSON.stringify(obj);
	}


	/*
	 * Sends a random entry from musicDb that wasn't submitted by the author. If all is true, sends entry from any server.
	 * recieves: author(string), channel(Channel object), serverId(string), all(bool).
	 * returns:
	*/
	function sendRandomEntryMusicDb(author, channel, serverId, from){
		fs.readFile(musicShareDb, 'utf8', function(err, data){
			if(err){console.log(err);}else{
				let musicDb = JSON.parse(data);
				let entryId;
				let entryN;
				if(from === 'server'){
					let users = Object.keys(musicDb.servers[serverId]);
					users.splice(users.indexOf('ids'), 1);
					if(musicDb.servers[serverId][author]){ 
						users.splice(users.indexOf(author), 1);
					}
					let entries = [];
					let usersIx = [];
					for(let i = 0; i < users.length; i++){
						entries = entries.concat(musicDb.servers[serverId][users[i]]);
						usersIx.push([(users[i]), (entries.length)]);
					}
					if(entries.length === 0){
						channel.send('No entries found in this server :(\nTry \'+-musicshare all\'.');
						return false;
					}
					entryN = Math.floor(Math.random()*(entries.length));
					entryId = entries[entryN];
				}else if(from === 'all'){
					let entries = Object.keys(musicDb.ids);
					entryId = entries[Math.floor(Math.random()*(entries.length))];
				}else{
					let user = from.split(' ');
					if(musicDb.servers[serverId][user[0]]){
						let entries = musicDb.servers[serverId][user[0]];
						entryId = entries[Math.floor(Math.random()*(entries.length))];
					}else{
						channel.send('There are no songs saved from this user.');
						return false;
					}
				}
				let msg = '';
				if(entryId.length === 1){
					channel.send('There was an error, try again!');
					return false;
				}else if(entryId.length <= 11){
					msg += 'If video is down please type \"+-report <link>\". Thanks for helping!\nhttps://www.youtube.com/watch?v='+entryId;
				}else{
					msg += 'https://open.spotify.com/'+entryId;
				}
				if(from === 'server'){
					for(let i = 0; i < usersIx.length; i++){
						if(entryN < usersIx[i][1]){
							client.fetchUser(usersIx[i][0]).then(function(data){
								channel.send('Submitted by: '+data.username+'\n'+msg);
							}, function(err){if(err){console.error(err);}});
							break;
						}
					}
				}else if(from !== 'all'){
					channel.send('Submitted by: '+user[1]+'\nTotal songs submitted: '+entries.length.toString()+'\n'+msg);
				}else{
					channel.send(msg);
				}
			}
		});
	}
};
