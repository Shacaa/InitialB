/* Copyright (c) 2019 Shacaa
 * MIT License: https://github.com/Shacaa/InitialB/blob/master/LICENSE.txt
 *
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
				checkMusicShare(lastOnline, client);
			}
		});
	}else if((args[0] === 'message') || (args[0] === 'add')){
		let linkIds = getYtSpLinkId(message.content);
		if(linkIds[0]){
			globals.botLog(client, linkIds);
			let ids = [];
			for(let i = 0; i < linkIds.length; i++){
				ids.push([linkIds[i], message.author.id, message.guild.id, message.id]);
			}
			globals.editJSON(musicShareDb, saveEntryMusicDb, [client, message.channel, ids]);
		}
	}else{
		let mentions = message.mentions.members.array();
		let from = 'server';
		if(args[0] === 'all'){
			from = 'all';
		}else if(mentions.length > 0){
			from = mentions[0].user.id +' '+mentions[0].user.username;
		}
		sendRandomEntryMusicDb(client, message.author.id, message.channel, message.guild.id, from);
	}

};




/*
 * Gets the youtube or spotify link id's from a string.
 * recieves: message(string)
 * returns: link id(array -> [id(string)]), or false if there is no link(array -> [false])
*/
function getYtSpLinkId(msg){
	let words = msg.split(/ |\n/);
	let ytTemplate = /(https:\/\/(www\.)?youtu\.?be)/;
	let sptTemplate = /(https:\/\/open.spotify.com\/((track)|(album)))/;
	let link = [false];
	let id;
	for(let i = 0; i < words.length; i++){
		if(ytTemplate.test(words[i])){
			if((/https:\/\/youtu.be/).test(words[i])){
				id = words[i].split('/')[3];
			}else{
				id = words[i].split('v=')[1];
			}
			if(!id){continue}
			id = (id.split('&')[0]).split('?')[0];
			if(id.length !== 11){continue}
			link.push(id);
			if(!link[0]){link.shift();}
		}else if(sptTemplate.test(words[i])){
			let linkParts = words[i].split('/');
			id = linkParts[3]+'/'+linkParts[4];
			id = id.split('?')[0];
			if(id.length !== 28){continue}
			link.push(id);
			if(!link[0]){link.shift();}
		}
	}
	return link;
}


/*
 * Goes through all the #musicshare channels in all the guilds to check old messages.
 * recieves: lastOnline(Date), client(class)
 * returns:
 */
function checkMusicShare(lastOnline, client){
	let guilds = client.guilds.array();
	for(let i = 0; i < guilds.length; i++){
		let channels = guilds[i].channels.array();
		for(let j = 0; j < channels.length; j++){
			let permissions = channels[j].permissionsFor(client.user);
			if((/^music-?share$/).test(channels[j].name) && permissions.has('VIEW_CHANNEL') && permissions.has('READ_MESSAGE_HISTORY')){
				processMsgMusicShare(client, channels[j], lastOnline);
			}
		}
	}

}


/*
 * Checks old messages in a channel that were posted since last time the bot was online.
 * If a message contains a yt/spotify link it will save it to the musicShareDb.
 * recieves: client(class), channel(class), lastOnline(Date), offset(messageId - string), toSave(array -> [[linkId(string), authorId(string), guildId(string), messageId(string)]])
 * returns:
 */
function processMsgMusicShare(client, channel, lastOnline, offset = false, toSave = []){
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
				for(let l = 0; l < linkIds.length; l++){
					toSave.push([linkIds[l], messages[i].author.id, messages[i].guild.id, messages[i].id]);
				}
			}
		}
		if(i === 100){
			processMsgMusicShare(client, channel, lastOnline, messages[i-1].id, toSave);
		}else{
			if(toSave.length > 0){
				globals.editJSON(musicShareDb, saveEntryMusicDb, [client, channel, toSave]);
				globals.editJSON(botStorage, function(data){
					let obj = JSON.parse(data);
					obj.lastOnline = new Date();
					return JSON.stringify(obj);
				});
			}
		}
	}).catch(err => console.error(err));
}


/*
 * Saves all given link ids in the musicShareDb, once saved it leaves a reation on the message.
 * recieves: client(class), channel(class), toSave(array -> [[linkId(string), authorId(string), guildId(string), messageId(string)]]), data(string)
 * returns: new stringify json(string)
*/
function saveEntryMusicDb(client, channel, toSave, data){
	let obj = JSON.parse(data);
	let permissions = channel.permissionsFor(client.user);
	let canReact = permissions.has('ADD_REACTIONS');
	console.log(toSave);
	for(let i = 0; i < toSave.length; i++){
		let author = toSave[i][1];
		let serverId = toSave[i][2];
		if(!obj['servers'][serverId]){
			obj['servers'][serverId] = {'ids':{}};
		}else if(obj['servers'][serverId]['ids'][toSave[i][0]]){
			console.log('skipped');
			continue;
		}
		if(!obj['servers'][serverId][author]){
			obj['servers'][serverId][author] = [];
			console.log('New user added to '+serverId);
		}
		obj['servers'][serverId][author].push(toSave[i][0]);
		obj['servers'][serverId]['ids'][toSave[i][0]] = [];
		if(!obj['ids'][toSave[i][0]]){
			obj['ids'][toSave[i][0]] = [];
		}
		canReact && globals.addReaction(channel, [toSave[i][3]], '💾');
	}
	return JSON.stringify(obj);
}


/*
 * If from is "server" it sends a random entry from musicShareDb that wasn't submitted by the author.
 * If from is "all", sends entry from any server.
 * If from is a mention it sends a random song submitted by that mentioned user.
 * recieves: client(class), author(string), channel(class), serverId(string), from(string).
 * returns: false if invalid
*/
function sendRandomEntryMusicDb(client, author, channel, serverId, from){
	fs.readFile(musicShareDb, 'utf8', function(err, data){
		if(err){console.log(err);}else{
			let musicDb = JSON.parse(data);
			let entries = [];
			let entryId;
			let entryN;
			let msg = '';
			let usersEntriesIx = [];
			let user;
			if(from !== 'all' && !musicDb.servers[serverId]){
				globals.editJSON(musicShareDb, data => {
					musicDb.servers[serverId] = {'ids':{}};
					console.log('Guild added to DB');
					return JSON.stringify(musicDb);
				});
				globals.sendMessage(channel, 'No entries found in this server :(\nTry \'+-musicshare all\'.');
				return false;
			}
			if(from === 'server'){
				let users = Object.keys(musicDb.servers[serverId]);
				musicDb.servers[serverId] && users.splice(users.indexOf('ids'), 1);
				if(musicDb.servers[serverId][author]){
					users.splice(users.indexOf(author), 1);
				}
				entries = [];
				for(let i = 0; i < users.length; i++){
					entries = entries.concat(musicDb.servers[serverId][users[i]]);
					usersEntriesIx.push([(users[i]), (entries.length)]);
				}
				if(entries.length === 0){
					globals.sendMessage(channel, 'No entries found in this server :(\nTry \'+-musicshare all\'.');
					return false;
				}
				entryN = Math.floor(Math.random()*(entries.length));
				entryId = entries[entryN];
			}else if(from === 'all'){
				entries = Object.keys(musicDb.ids);
				entryId = entries[Math.floor(Math.random()*(entries.length))];
			}else{
				user = from.split(' ');
				if(musicDb.servers[serverId][user[0]]){
					entries = musicDb.servers[serverId][user[0]];
					entryId = entries[Math.floor(Math.random()*(entries.length))];
				}else{
					globals.sendMessage(channel, 'There are no songs saved from this user.');
					return false;
				}
			}
			if(entryId.length === 11){
				msg += 'If video is down please type \"+-report <link>\". Thanks for helping!\nhttps://www.youtube.com/watch?v='+entryId;
			}else if(entryId.length === 28){
				msg += 'https://open.spotify.com/'+entryId;
			}else{
				globals.sendMessage(channel, 'There was an error, try again!');
				return false;
			}
			if(from === 'server'){
				for(let i = 0; i < usersEntriesIx.length; i++){
					if(entryN < usersEntriesIx[i][1]){
						client.fetchUser(usersEntriesIx[i][0]).then(function(data){
							globals.sendMessage(channel, 'Submitted by: '+data.username+'\n'+msg);
						}, function(err){if(err){console.error(err);}});
						break;
					}
				}
			}else if(from !== 'all'){
				globals.sendMessage(channel, 'Submitted by: '+user[1]+'\nTotal songs submitted: '+entries.length.toString()+'\n'+msg);
			}else{
				globals.sendMessage(channel, msg);
			}
		}
	});
}
