/* Copyright (c) 2019 Shacaa
 * MIT License: https://github.com/Shacaa/InitialB/blob/master/LICENSE.txt
 *
 */

const eventCommands = './files/eventCommands.txt';
const scheduleDb = './files/scheduleDb.json';
const globals = require('./globals.js');
const fs = require('fs');
const schedule = require('node-schedule');


exports.run = (client,reddit, spotify, message, args) => {

	/*
	 * Schedules all the events from DB for the following 2 days.
	 */
	if(args[0] === 'runScheduler'){
		scheduleNearEvents(client);


	/*
	 * Depending of the arguments it calls different functions.
	 */
	}else if(args[0] === 'help'){
		fs.readFile(eventCommands, 'utf8', function(err, data){
			if(err){console.log(err);}else{globals.sendMessage(message.channel, {embed:{title:'Event commands', color:10477034, description:data}});}
		});
	}else if(args[0] === 'create'){
		createEvent(message, client);
	}else if(args[0] === 'list'){
		listEvents(message.guild, message.channel);
	}else if(!isNaN(args[0]) && !args[1]){
		aboutEvent(message.guild, message.channel, parseInt(args[0])-1);
	}else if(!isNaN(args[0]) && args[1] === 'cantattend'){
		cantAssistEvent(message.author, message.guild.id, parseInt(args[0])-1, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'join'){
		joinEventDate(message.author, message.guild.id, parseInt(args[0])-1, 0, message.channel, true);
	}else if(!isNaN(args[0]) && args[1] === 'vote' && !isNaN(args[2])){
		joinEventDate(message.author, message.guild.id, parseInt(args[0])-1, parseInt(args[2])-1, message.channel, false);
	}else if(!isNaN(args[0]) && args[1] === 'leave'){
		leaveEventDate(message.author, message.guild.id, parseInt(args[0])-1, 0, false, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'cancelvote' && !isNaN(args[2])){
		leaveEventDate(message.author, message.guild.id, parseInt(args[0])-1, parseInt(args[2])-1, true, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'closevotes'){
		closeVotes(message.author, message.guild, parseInt(args[0])-1, message.channel, client);
	}else if(!isNaN(args[0]) && args[1] === 'cancel'){
		cancelEvent(message.author, message.guild.id, parseInt(args[0])-1, message.channel, client);
	}else if(!isNaN(args[0]) && (args[1] === 'participants' || args[1] === 'cantattendlist')){
		listEventMembers(message.guild.id, parseInt(args[0])-1, args[1], 0, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'datevotes' && !isNaN(args[2])){
		listEventMembers(message.guild.id, parseInt(args[0])-1, args[1], parseInt(args[2])-1, message.channel);
	}
	
};



/*
 * Checks if given event has already ended.
 * Recieves: event(Object), now(Date)
 * Returns: boolean
 */
function isOldEvent(event, now){
	let dates = event.dates;
	let isOld = true;
	for(let i = 0; i < dates.length; i++){
		let date = new Date(dates[i][0]);
		if(date > now){
			isOld = false;
		}
	}
	return isOld;
}


/*
 * Schedules all future events of the next two days from now.
 * Also deletes any old event.
 * Recieves: client(class)
 * Returns:
*/
function scheduleNearEvents(client){
	let now = new Date();
	let nowPlus2 = (new Date()).setDate(now.getDate() + 2);
	let toDelete = [];
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			let guilds = Object.keys(obj.guilds);
			for(let i = 0; i < guilds.length; i++){
				let events = obj.guilds[guilds[i]].events;
				for(let j = 0; j < events.length; j++){
					if(isOldEvent(events[j], now)){
						toDelete.push([guilds[i], events[j]]);
					}else if(events[j].dates.length === 1){
						let date = new Date(events[j].dates[0][0]);
						if(date > nowPlus2){continue;}
						scheduleEvent(client.guilds.get(guilds[i]), events[j], client);
					}
				}
			}
			deleteEvents(toDelete, client);
		}
	});
}


/*
 * Schedules given event if a date has been decided.
 * Recieves: guild(class), event(Object), client(class)
 * Returns:
*/
function scheduleEvent(guild, event, client){
	if(event.dates.length > 1){return false;}
	let date = new Date(event.dates[0][0]);
	schedule.scheduleJob(date, function(){
		notifyEvent(guild, event, 'Is time for the event!', client);
	});
	date.setHours(date.getHours()-1);
	schedule.scheduleJob(date, function(){
		console.log('One hour for: '+event.name);
		notifyEvent(guild, event, 'One hour left before the event starts:', client);
	});
	console.log(guild.name+': \"'+event.name+'\" scheduled.');
}


/*
 * Notifies in the event's channel the information of the event with given message.
 * Dm to everyone interested in the event the information of the event with given message.
 * Recieves: guild(class), event(Object), msg(string), client(class)
 * Returns:
*/
function notifyEvent(guild, event, msg, client){
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			let eventPos = -1;
			for(let i = 0; i < obj.guilds[guild.id].events.length; i++){
				if(event.id === obj.guilds[guild.id].events[i].id){
					eventPos = i;
					break;
				}
			}
			if(eventPos === -1){return false;}
			globals.botLog(client, event.name+' - event running');
			globals.botLog(client, 'Notifying event:\n'+guild.name+': \"'+event.name+'\"');
			let channel = guild.channels.get(event.channel[1]);
			globals.sendMessage(channel, msg);
			aboutEvent(guild, channel, eventPos);
			let participants = Object.keys(obj.guilds[guild.id].events[eventPos].dates[0][1]);
			for(let i = 0; i < participants.length; i++){
				if(participants[i] === 'votes'){continue;}
				client.fetchUser(participants[i]).then(data => {
					data.createDM().then(dm => {
						dm.send('Server: '+guild.name+'\n'+msg).catch(err => console.error(err));
						aboutEvent(guild, dm, eventPos);
					}).catch(err => console.error(err));
				}).catch(err => console.error(err));
			}
		}
	});
}


/*
 * Guides the user with some questions to create an event.
 * Recieves: message(class), client(class)
 * Returns:
*/
function createEvent(message, client){
	let year = (new Date()).getFullYear();
	let author = message.author;
	let event = {host:[author.username, author.id], channel:[message.channel.name, message.channel.id], cant:{total:0}, interested:{}};
	let filter = m => m.author === author;
	let filterDate = mm => ((mm.author === author) && (checkDate(mm, author)));
	let cOptions = {max: 1, time: 300000, errors: ['time']};
	let timeOutMsg = 'You ran out of time, you have five minutes per question. Try again!';
	globals.sendMessage(message.channel, 'Name of the event?');
	message.channel.awaitMessages(filter, cOptions).then(function(m){
		event.name = (m.array())[0].content;
		globals.sendMessage(message.channel, 'Description of the event?');
		message.channel.awaitMessages(filter, cOptions).then(function(m2){
			event.description = (m2.array())[0].content;
			let time = new Date();
			globals.sendMessage(message.channel, 'What date? (DD-MM-HR:MN) in UTC/GMT. For multiple dates separate by space.\nTime now is '+time.toUTCString());
			message.channel.awaitMessages(filterDate, cOptions).then(function(m3){
				event.dates = [];
				let dates = (m3.array())[0].content.split(' ');
				for(let i = 0; i < dates.length; i++){
					let d = dates[i].split('-').join(':').split(':');
					let date = new Date(year, d[1]-1, parseInt(d[0], 10), d[2]-3, parseInt(d[3], 10));
					event.dates.push([date, {votes: 0}]);
				}
				saveEvent(event, message, client);
				scheduleEvent(message.guild, event, client);
			}).catch(function(){globals.sendMessage(message.channel, timeOutMsg);});
		}).catch(function(){globals.sendMessage(message.channel, timeOutMsg);});
	}).catch(function(){globals.sendMessage(message.channel, timeOutMsg);});
}


/*
 * Checks if given message has a valid date format and if the message's author is the same one that started creating the event.
 * Recieves: message(class), oAuthor(class)
 * Returns: boolean
*/
function checkDate(message, oAuthor){
	let dTemplate = [31, 12, 24, 59];
	if(message.author !== oAuthor){
		return false;
	}
	let dates = message.content.split(' ');
	for(let i = 0; i < dates.length; i++){
		let date = dates[i].split('-').join(':').split(':');
		if(date.length !== 4){
			globals.sendMessage(message.channel, 'Wrong date format, try again.');
			return false;
		}
		for(let j = 0; j < 4; j++){
			if(date[j] < 0 || date[j] > dTemplate[j]){
				globals.sendMessage(message.channel, 'Wrong date format, try again.');
				return false;
			}
		}
	}
	return true;
}


/*
 * Saves given event to the scheduleDb.
 * Recieves: event(Object), message(class), client(class)
 * Returns: string(stringify json)
*/
function saveEvent(event, message, client){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		if(!obj.guilds[message.guild.id]){
			obj.guilds[message.guild.id] = {name:message.guild.name, events: [], ids: 0};
		}
		obj.guilds[message.guild.id].ids++;
		event['id'] = obj.guilds[message.guild.id].ids;
		obj.guilds[message.guild.id].events.push(event);
		globals.botLog(client, 'New event saved in '+message.guild.name+'\nEvent: '+event.name);
		globals.sendMessage(message.channel, 'Your event has been saved!\nUse \"+-event '+obj.guilds[message.guild.id].events.length.toString()+'\" to see its info.');
		return JSON.stringify(obj);
	});
}


/*
 * Checks if the scheduleDb has given event.
 * Recieves: schedules(Object), channel(class), guildId(string), eventPos(int)
 * Returns: boolean
*/
function hasEvent(schedules, channel, guildId, eventPos = -1){
	if(!schedules.guilds[guildId] || schedules.guilds[guildId].events.length === 0){
		globals.sendMessage(channel, 'There are no events for this server. Use \"+-event create\" to create one!');
		return false;
	}else if(schedules.guilds[guildId].events.length <= eventPos){
		globals.sendMessage(channel, 'There are no events with that number. Use \"+-event list\" to see all the events.');
		return false;
	}
	return true;
}


/*
 * Deletes from the scheduleDb all given events.
 * Recieves: toDelete(array -> [[guildId1 (string), event1 (object)]]), client(class)
 * Returns: string(stringify json)
*/
function deleteEvents(toDelete, client){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		for(let i = 0; i < toDelete.length; i++){
			let events = obj.guilds[toDelete[i][0]].events;
			for(let j = 0; j < events.length; j++){
				if(events[j].id === toDelete[i][1].id){
					events.splice(j, 1);
					globals.botLog(client, 'Event deleted: \"'+toDelete[i][1].name+'\" '+toDelete[i][0]);
					break;
				}
			}
		}
		return JSON.stringify(obj);
	});
}

/*
 * Sends in given channel a list of all the events from that guild.
 * Recieves: guild(class), channel(class)
 * Returns:
*/
function listEvents(guild, channel){
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guild.id)){
				let events = obj.guilds[guild.id].events;
				let list = '';
				for(let i = 0; i < events.length; i++){
					list += (i+1).toString()+'- '+events[i].name+'\n'
				}
				globals.sendMessage(channel, {embed:{title:guild.name+' Events', color:10477034, description:list, footer:{text:'\"+-event <number>\" to see info about the event.'}}});
			}
		}
	});
}


/*
 * Sends in given channel all the information about given event.
 * Recieves: guild(class), channel(class), eventPos(int)
 * Returns:
*/
function aboutEvent(guild, channel, eventPos){
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guild.id, eventPos)){
				let event = obj.guilds[guild.id].events[eventPos];
				let dates = event.dates;
				let info = '';
				let foot = '';
				let actualDate = new Date();
				info += '**Time right now is:**\n'+actualDate.toUTCString()+'\n\n';
				if(dates.length > 1){
					info += '**Date:** Vote with \"+-event '+(eventPos+1).toString()+' vote <number>\".\n';
					for(let i = 0; i < dates.length; i++){
						let date = new Date(dates[i][0]);
						info += (i+1).toString()+'- '+date.toUTCString()+' ('+dates[i][1].votes.toString()+' votes)\n';
					}
				}else{
					let date = new Date(event.dates[0][0]);
					info += '**Date:** '+date.toUTCString()+'\n';
					info += '**Participants:** '+dates[0][1].votes.toString()+'\n';
					foot += '\"+-event '+(eventPos+1).toString()+' join\" to join this event.';
				}
				info += '**Can\'t attend:** '+event.cant.total.toString()+'\n';
				info += '**Host:** '+event.host[0]+'\n';
				info += '**Channel:** '+event.channel[0]+'\n';
				info += '**Description:** \n'+event.description;
				globals.sendMessage(channel, {embed:{title:event.name, color:10477034, description:info, footer:{text:foot}}});
			}
		}
	});
}


/*
 * Sends in given channel a list of all the members from given event that voted/joined the given date.
 * Recieves: guildId(string), eventPos(int), toShow(string -> 'command'), datePos(int), channel(class)
 * Returns:
*/
function listEventMembers(guildId, eventPos, toShow, datePos = -1, channel){
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guildId, eventPos)){
				let event = obj.guilds[guildId].events[eventPos];
				let text = '';
				let membersInfo = {};
				let members = [];
				if(toShow === 'cantattendlist'){
					text += '**Can\'t attend:**\n\n';
					members = Object.keys(event.cant);
					membersInfo = event.cant;
				}else if(toShow === 'participants' && event.dates.length > 1){
					globals.sendMessage(channel, 'Date hasn\'t been decided yet.\nUse \"+-event '+(eventPos+1).toString()+' datevotes <date number>\" to see who voted for that date.');
					return false;
				}else{
					if(datePos < 0 || datePos >= event.dates.length){
						globals.sendMessage(channel, 'Invalid date, use \"+-event '+(eventPos+1).toString()+' info\" to check all dates.');
						return false;
					}else{
						let date = new Date(event.dates[datePos][0]);
						text += '**'+date.toUTCString()+'**\n\n';
						members = Object.keys(event.dates[datePos][1]);
						membersInfo = event.dates[datePos][1];
					}
				}
				let count = 0;
				for(let i = 0; i < members.length; i++){
					if(members[i] === 'total' || members[i] === 'votes'){
						count++;
						continue;
					}
					text += (i+1-count).toString()+'- '+membersInfo[members[i]]+'\n';
				}
				globals.sendMessage(channel, {embed:{title:event.name, color:10477034, description:text, footer:{text:'\"+-event '+(eventPos+1).toString()+'\" for more info about the event.'}}});
			}
		}
	});
}

/*
 * Adds user to given date of given event.
 * Recieves: user(class), guildId(string), eventPos(int), datePos(int), channel(class), join(boolean -> true(join), false(vote))
 * Returns: string(stringify json), false(invalid date/event)
*/
function joinEventDate(user, guildId, eventPos, datePos, channel, join){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		if(hasEvent(obj, channel, guildId, eventPos)){
			let event = obj.guilds[guildId].events[eventPos];
			if(join && event.dates.length > 1){
				globals.sendMessage(channel, 'You can\'t join yet, votes for dates are still open. Use \"+-event '+(eventPos+1).toString()+'\" to see all the dates.');
			}else if(event.dates.length <= datePos || datePos < 0){
				globals.sendMessage(channel, 'Invalid date, use \"+-event '+(eventPos+1).toString()+'\" to see all the dates.');
			}else if(event.dates[datePos][1][user.id]){
				globals.sendMessage(channel, 'You have already joined/voted for this date!');
			}else{
				if(event.cant[user.id]){
					delete event.cant[user.id];
					event.cant.total--;
				}
				if(!event.interested[user.id]){
					event.interested[user.id] = 1;
				}else{
					event.interested[user.id]++;
				}
				event.dates[datePos][1][user.id] = user.username;
				event.dates[datePos][1].votes++;
				if(join){
					globals.sendMessage(channel, 'You have joined \"'+event.name+'\" event!');
				}else{
					let date = new Date(event.dates[datePos][0]);
					globals.sendMessage(channel, 'You have voted for \"'+date.toUTCString()+'\"!');
				}
				return JSON.stringify(obj);
			}
		}
		return false;
	});
}

/*
 * Deletes user from given date of given event.
 * If it was the only date they were in, they also get deleted from list of interested people.
 * Recieves: user(class), guildId(string), eventPos(int), datePos(int), unvote(boolean -> true(cancel vote), false(leave event)), channel(class)
 * Returns: string(stringify json), false(invalid event/date)
*/
function leaveEventDate(user, guildId, eventPos, datePos, unvote, channel){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		if(hasEvent(obj, channel, guildId, eventPos)){
			let event = obj.guilds[guildId].events[eventPos];
			if(0 > datePos || datePos >= event.dates.length ){
				globals.sendMessage(channel, 'Invalid date, use \"+-event '+(eventPos+1).toString()+'\" to check all dates.');
			}else if(!event.dates[datePos][1][user.id]){
				if(unvote){
					globals.sendMessage(channel, 'You have never voted for this date!');
				}else{
					globals.sendMessage(channel, 'You have never joined this event!');
				}
			}else{
				delete event.dates[datePos][1][user.id];
				event.dates[datePos][1].votes--;
				event.interested[user.id]--;
				if(event.interested[user.id] === 0){
					delete event.interested[user.id];
				}
				if(!unvote){
					globals.sendMessage(channel, 'You have left \"'+event.name+'\" event!');
				}else{
					let date = new Date(event.dates[datePos][0]);
					globals.sendMessage(channel, 'You have cancelled your vote for \"'+date.toUTCString()+'\".')
				}

				return JSON.stringify(obj);
			}
		}
		return false;
	});
}

/*
 * Adds user to the list of members that can't attend to given event.
 * Recieves: user(class), guildId(string), eventPos(int), channel(class)
 * Returns: string(stringify json), false(invalid event)
*/
function cantAssistEvent(user, guildId, eventPos, channel){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		if(hasEvent(obj, channel,guildId, eventPos)){
			let event = obj.guilds[guildId].events[eventPos];
			if(!event.cant[user.id]){
				if(event.interested[user.id]){
					delete event.interested[user.id];
					let dates = event.dates;
					for(let i = 0; i < dates.length; i++){
						if(dates[i][1][user.id]){
							delete dates[i][1][user.id];
							dates[i][1].votes--;
						}
					}
				}
				event.cant[user.id] = user.username;
				event.cant.total++;
				globals.sendMessage(channel, 'You have been added to the list of people that can\'t attend the event.');
				return JSON.stringify(obj);
			}
		}
		return false;
	});
}


/*
 * Sets given date as the date for the event.
 * Notifies all the members interested in the event about the decided date.
 * Recieves: guild(class), eventPos(int), finalDate(array -> [Date, object]), channel(class), client(class)
 * Returns: string(stringify json)
*/
function decideDate(guild, eventPos, finalDate, channel, client){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		let date = new Date(finalDate[0]);
		let event = obj.guilds[guild.id].events[eventPos];
		event.dates = [finalDate];
		let text = 'Votes closed! Final date for \"'+event.name+'\" is:\n'+date.toUTCString()+'.';
		globals.sendMessage(channel, text);
		let members = Object.keys(event.interested);
		for(let i = 0; i < members.length; i++){
			globals.sendDm(client, members[i], 'Server: '+guild.name+'\n'+text);
		}
		scheduleEvent(guild, event, client);
		return JSON.stringify(obj);
	});
}


/*
 * Gives event's host all the options to choose from to decide a final date for the event.
 * Sets that date for the event.
 * Recieves: user(class), guild(class), eventPos(int), channel(class), client(class)
 * Returns:
*/
function closeVotes(user, guild, eventPos, channel, client){
	fs.readFile(scheduleDb, 'utf8', function(err, data){
		if(err){console.error(err);}else{
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guild.id, eventPos)){
				let event = obj.guilds[guild.id].events[eventPos];
				if(event.host[1] !== user.id){
					globals.sendMessage(channel, 'Only the host can close the votings for the date.');
				}else if(event.dates.length === 1){
					globals.sendMessage(channel, 'The date for this event has already been decided.');
				}else{
					let text = 'Choose beetween one of the following dates:\n';
					for(let i = 0; i < event.dates.length; i++){
						let date = new Date(event.dates[i][0]);
						text += (i+1).toString()+'- '+date.toUTCString()+' ('+event.dates[i][1].votes.toString()+' votes)\n';
					}
					let filter = m => ((m.author === user) && function(m){return(!isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= event.dates.length);});
					globals.sendMessage(channel, text);
					channel.awaitMessages(filter, {max: 1, time: 120000, errors: ['time']}).then(function(m){
						let vote = (m.array())[0].content;
						decideDate(guild, eventPos, event.dates[parseInt(vote)-1], channel, client);
					}).catch(function(){globals.sendMessage(channel, 'You\'ve ran out of time, try again.');});
				}
			}
		}
	});
}


/*
 * Deletes given date from the scheduleDb.
 * Recieves: user(class), guildId(string), eventPos(int), channel(class), client(class)
 * Returns: string(stringify json), false(invalid event)
*/
function cancelEvent(user, guildId, eventPos, channel, client){
	globals.editJSON(scheduleDb, function(data){
		let obj = JSON.parse(data);
		if(hasEvent(obj, channel, guildId, eventPos)){
			let event = obj.guilds[guildId].events[eventPos];
			if(user.id !== event.host[1]){
				globals.sendMessage(channel, 'Only the host can cancel the event.');
			}else{
				obj.guilds[guildId].events.splice(eventPos, 1);
				globals.sendMessage(channel, '\"'+event.name+'\" event has been cancelled!');
				globals.botLog(client, 'Event cancelled: \"'+event.name+'\"');
				return JSON.stringify(obj);
			}
		}
		return false;
	});
}
