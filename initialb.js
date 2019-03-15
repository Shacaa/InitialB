/*
 *_functions() prints stuff on console.
 * 
*/


const globals = require('./commands/globals.js');
const botInfo = require('./files/botInfo.json');
const botStorage = './files/botStorage.json';
const botLog = './botLog.txt';

const Discord = require('discord.js');
const client = new Discord.Client();

const snoowrap = require('snoowrap');
const reddit = new snoowrap(botInfo.reddit);

const spotifyWebApi = require('spotify-web-api-node');
const spotify = new spotifyWebApi(botInfo.spotify);

const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
rule.minute = (new Date()).getMinutes() + 1;



client.on('ready', function(){
	console.log('ready to drift!');
	globals.editJSON(botStorage, function(data){
		let obj = JSON.parse(data);
		obj.isOnline = true;
		return JSON.stringify(obj);
	});
	client.user.setPresence({game:{name:'+-help'}, status:'online'}).catch(err => console.error(err));
	let musicshare = require('./commands/musicshare.js');
	let event = require('./commands/event.js');
	musicshare.run(client, reddit, spotify, false, ['processMsChannels']);
	event.run(client, reddit, spotify, false, ['runScheduler']);
});


client.on('error', function(err){
	if(err.code = 'ENOENT'){
		globals.botLog(client, 'connection lost');
		globals.editJSON(botStorage, function(data){
			let obj = JSON.parse(data);
			if(obj.isOnline){
				obj.lastOnline = new Date();
				obj.isOnline = false;
			}
			return JSON.stringify(obj);
		});
	}
});


/*
* If you set a directory of a message handler in botInfo.owner.localMessageHandler it will run that first (needs a .run).
* Make it return true if you want to stop the message handler afterwards.
* Otherwise it will continue with the normal message handler.
* recieves: message(class)
* returns: boolean
*
*/
function localMessageHandler(message){
	if(botInfo.owner.localMessageHandler){
		let localHandler = require(botInfo.owner.localMessageHandler);
		return localHandler.run(client, message);
	}
	return false;
}



/*
 * Message/command handler.
 */
client.on('message', function(message){
	if(localMessageHandler(message)){
		return;
	}
	if((message.content.startsWith('+-')) && (!message.author.bot)){
		if(message.channel.type === 'dm'){
			globals.sendMessage(message.channel, "At the moment you can't use commands in dm's, will make it possible soon.\nMake sure to use \"+-help\" on your server to get a list of all the commands!");
			globals.botLog(client, `Use of command in dm:\n${message.author.username} - ${message.author.id}\nMessage: ${message.content}`);
			return false;
		}
		let permissions = message.channel.permissionsFor(client.user);
		if(!permissions.has('SEND_MESSAGES')){return false;}
		let args = message.content.slice(2).trim().split(' ');
		let command = args.shift();
		globals.botLog(client, message.author.id+'\n'+command+': '+args.toString());
		if(botInfo.commands[command]){
			try{
				let commandFile = require(`./commands/${command}.js`);
				commandFile.run(client, reddit, spotify, message, args);
			}catch (err){
				console.error(err);
			}
		}else{
			globals.sendMessage(message.channel, 'Use \"+-help\" to get a list of all the commands.');
		}
		
	}else if((/^music-?share$/).test(message.channel.name) && !message.author.bot){
		let commandFile = require('./commands/musicshare.js');
		commandFile.run(client, reddit, spotify, message, ['message']);
	}
});


/*
 * When the bot joins a server it adds it to musicShareDb and notifies bot's owner about it.
 */
client.on('guildCreate', function(guild){
	let msg = 'Joined '+guild.name+' guild.\nGuild id: '+guild.id;
	globals.botLog(client, msg);
	globals.sendDm(client, botInfo.owner.id, msg+'\nOwner: '+guild.owner.user.username+' - '+guild.ownerID);
	globals.editJSON('./files/musicShareDb.json', function(data){
		let obj = JSON.parse(data);
		if(!obj.servers[guild.id]){
			obj.servers[guild.id] = {'ids':{}};
		}
		return JSON.stringify(obj);
	});
});


schedule.scheduleJob(rule, function(){
	globals.botLog(client, 'Getting spotify credentials.');
	spotify.clientCredentialsGrant().then(function(data, err){
		if(err){console.error(err);}else{
			globals.botLog(client, 'Spotify access token expires in '+data.body['expires_in']);
			spotify.setAccessToken(data.body['access_token']);
		}
	});
});

client.login(botInfo.discord.token).catch(err => console.error(err));

