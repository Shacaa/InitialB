/* 
 * Event Scheduler.
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
		scheduleNearEvents();
	
	
	/*
	 * Depending of the arguments it calls different functions.
	 */
	}else if(args[0] === 'help'){
		fs.readFile(eventCommands, 'utf8', function(err, data){
			if(err){console.log(err);}else{message.channel.send({embed:{title:'Event commands', color:10477034, description:data}});}
		});
	}else if(args[0] === 'create'){
		createEvent(message);
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
		closeVotes(message.author, message.guild, parseInt(args[0])-1, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'cancel'){
		cancelEvent(message.author, message.guild.id, parseInt(args[0])-1, message.channel);
	}else if(!isNaN(args[0]) && (args[1] === 'participants' || args[1] === 'cantattendlist')){
		listEventMembers(message.guild.id, parseInt(args[0])-1, args[1], 0, message.channel);
	}else if(!isNaN(args[0]) && args[1] === 'datevotes' && !isNaN(args[2])){
		listEventMembers(message.guild.id, parseInt(args[0])-1, args[1], parseInt(args[2])-1, message.channel);
	}
	
	
	////////////////////////FUNCTIONS//////////////////////////
	

	/*
	 * Checks if given event has already ended.
	 * Recieves: event(Object), now(Date)
	 * Returns: bool
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
	 * Recieves: 
	 * Returns: 
	*/
	function scheduleNearEvents(){
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
							scheduleEvent(client.guilds.get(guilds[i]), events[j]);
						}
					}
				}
				deleteEvents(toDelete);
			}
		});
	}


	/*
	 * Schedules given event if a date has been decided.
	 * Recieves: guild(class), event(Object)
	 * Returns:
	*/
	function scheduleEvent(guild, event){
		if(event.dates.length > 1){return false;}
		let date = new Date(event.dates[0][0]);
		schedule.scheduleJob(date, function(){
			globals.dateTime(client, event.name+' - event running');
			notifyEvent(guild, event, 'Is time for the event!');
		});
		date.setHours(date.getHours()-1);
		schedule.scheduleJob(date, function(){
			console.log('One hour for: '+event.name);
			notifyEvent(guild, event, 'One hour left before the event starts:');
		});
		console.log(guild.name+': \"'+event.name+'\" scheduled.');
	}


	/*
	 * Notifies in the event's channel the information of the event with given message.
	 * Dm to everyone interested in the event the information of the event with given message.
	 * Recieves: guild(class), event(Object), msg(string)
	 * Returns:
	*/
	function notifyEvent(guild, event, msg){
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
				globals.dateTime(client, 'Notifying event:\n'+guild.name+': \"'+event.name+'\"');
				let channel = guild.channels.get(event.channel[1]);
				channel.send(msg);
				aboutEvent(guild, channel, eventPos);
				let participants = Object.keys(obj.guilds[guild.id].events[eventPos].dates[0][1]);
				for(let i = 0; i < participants.length; i++){
					if(participants[i] === 'votes'){continue;}
					client.fetchUser(participants[i]).then(function(data){
						data.createDM().then(function(dm){
							dm.send('Server: '+guild.name+'\n'+msg);
							aboutEvent(guild, dm, eventPos);
						}, function(err){if(err){console.error(err);}});
					}, function(err){if(err){console.error(err);}});
				}
			}
		});
	}


	/*
	 * Guides the user with some questions to create an event.
	 * Recieves: message(class)
	 * Returns: 
	*/
	function createEvent(message){
		let year = (new Date()).getFullYear();
		let author = message.author;
		let event = {host:[author.username, author.id], channel:[message.channel.name, message.channel.id], cant:{total:0}, interested:{}};
		let filter = m => m.author === author;
		let filterDate = mm => ((mm.author === author) && (checkDate(mm, author)));
		let cOptions = {max: 1, time: 300000, errors: ['time']};
		let timeOutMsg = 'You ran out of time, you have five minutes per question. Try again!';
		message.channel.send('Name of the event?');
		message.channel.awaitMessages(filter, cOptions).then(function(m){
			event.name = (m.array())[0].content;
			message.channel.send('Description of the event?');
			message.channel.awaitMessages(filter, cOptions).then(function(m2){
				event.description = (m2.array())[0].content;
				let time = new Date();
				message.channel.send('What date? (DD-MM-HR:MN) in UTC/GMT. For multiple dates separate by space.\nTime now is '+time.toUTCString());
				message.channel.awaitMessages(filterDate, cOptions).then(function(m3){
					event.dates = [];
					let dates = (m3.array())[0].content.split(' ');
					for(let i = 0; i < dates.length; i++){
						let d = dates[i].split('-').join(':').split(':');
						let date = new Date(year, d[1]-1, parseInt(d[0], 10), d[2]-3, parseInt(d[3], 10));
						event.dates.push([date, {votes: 0}]);
					}
					saveEvent(event, message);
					scheduleEvent(message.guild, event);
				}).catch(function(){message.channel.send(timeOutMsg);});
			}).catch(function(){message.channel.send(timeOutMsg);});
		}).catch(function(){message.channel.send(timeOutMsg);});
	}


	/*
	 * Checks if given message has a valid date format and if the message's author is the same one that started creating the event.
	 * Recieves: message(class), oAuthor(class)
	 * Returns: bool
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
				message.channel.send('Wrong date format, try again.');
				return false;
			}
			for(let j = 0; j < 4; j++){
				if(date[j] < 0 || date[j] > dTemplate[j]){
					message.channel.send('Wrong date format, try again.');
					return false;
				}
			}
		}
		return true;
	}


	/*
	 * Saves given event to the scheduleDb.
	 * Recieves: event(Object), message(class)
	 * Returns: string(stringify json)
	*/
	function saveEvent(event, message){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			if(!obj.guilds[message.guild.id]){
				obj.guilds[message.guild.id] = {name:message.guild.name, events: [], ids: 0};
			}
			obj.guilds[message.guild.id].ids++;
			event['id'] = obj.guilds[message.guild.id].ids;
			obj.guilds[message.guild.id].events.push(event);
			globals.botLog(client, 'New event saved in '+message.guild.name+'\nEvent: '+event.name);
			message.channel.send('Your event has been saved!\nUse \"+-event '+obj.guilds[message.guild.id].events.length.toString()+'\" to see its info.');
			return JSON.stringify(obj);
		});
	}


	/*
	 * Checks if the scheduleDb has given event.
	 * Recieves: schedules(Object), channel(class), guildId(string), eventPos(int)
	 * Returns: bool
	*/
	function hasEvent(schedules, channel, guildId, eventPos = -1){
		if(!schedules.guilds[guildId] || schedules.guilds[guildId].events.length === 0){
			channel.send('There are no events for this server. Use \"+-event create\" to create one!');
			return false;
		}else if(schedules.guilds[guildId].events.length <= eventPos){
			channel.send('There are no events with that number. Use \"+-event list\" to see all the events.');
			return false;
		}
		return true;
	}


	/*
	 * Deletes from the scheduleDb all given events.
	 * Recieves: toDelete(array -> [[guildId1 (string), event1 (object)]])
	 * Returns: string(stringify json)
	*/
	function deleteEvents(toDelete){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			for(let i = 0; i < toDelete.length; i++){
				let events = obj.guilds[toDelete[i][0]].events;
				for(let j = 0; j < events.length; j++){
					if(events[j].id === toDelete[i][1].id){
						events.splice(j, 1);
						globals.dateTime(client, 'Event deleted: \"'+toDelete[i][1].name+'\" '+toDelete[i][0]);
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
					channel.send({embed:{title:guild.name+' Events', color:10477034, description:list, footer:{text:'\"+-event <number>\" to see info about the event.'}}});
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
					channel.send({embed:{title:event.name, color:10477034, description:info, footer:{text:foot}}});
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
						channel.send('Date hasn\'t been decided yet.\nUse \"+-event '+(eventPos+1).toString()+' datevotes <date number>\" to see who voted for that date.');
						return false;
					}else{
						if(datePos < 0 || datePos >= event.dates.length){
							channel.send('Invalid date, use \"+-event '+(eventPos+1).toString()+' info\" to check all dates.');
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
					channel.send({embed:{title:event.name, color:10477034, description:text, footer:{text:'\"+-event '+(eventPos+1).toString()+'\" for more info about the event.'}}});
				}
			}
		});
	}

	/*
	 * Adds user to given date of given event.
	 * Recieves: user(class), guildId(string), eventPos(int), datePos(int), channel(class), join(bool -> true(join), false(vote))
	 * Returns: string(stringify json), false(invalid date/event)
	*/
	function joinEventDate(user, guildId, eventPos, datePos, channel, join){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guildId, eventPos)){
				let event = obj.guilds[guildId].events[eventPos];
				if(join && event.dates.length > 1){
					channel.send('You can\'t join yet, votes for dates are still open. Use \"+-event '+(eventPos+1).toString()+'\" to see all the dates.');
				}else if(event.dates.length <= datePos || datePos < 0){
					channel.send('Invalid date, use \"+-event '+(eventPos+1).toString()+'\" to see all the dates.');
				}else if(event.dates[datePos][1][user.id]){
					channel.send('You have already joined/voted for this date!');
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
						channel.send('You have joined \"'+event.name+'\" event!');
					}else{
						let date = new Date(event.dates[datePos][0]);
						channel.send('You have voted for \"'+date.toUTCString()+'\"!');
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
	 * Recieves: user(class), guildId(string), eventPos(int), datePos(int), unvote(bool -> true(cancel vote), false(leave event)), channel(class)
	 * Returns: string(stringify json), false(invalid event/date)
	*/
	function leaveEventDate(user, guildId, eventPos, datePos, unvote, channel){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guildId, eventPos)){
				let event = obj.guilds[guildId].events[eventPos];
				if(0 > datePos || datePos >= event.dates.length ){
					channel.send('Invalid date, use \"+-event '+(eventPos+1).toString()+'\" to check all dates.');
				}else if(!event.dates[datePos][1][user.id]){
					if(unvote){
						channel.send('You have never voted for this date!');
					}else{
						channel.send('You have never joined this event!');
					}
				}else{
					delete event.dates[datePos][1][user.id];
					event.dates[datePos][1].votes--;
					event.interested[user.id]--;
					if(event.interested[user.id] === 0){
						delete event.interested[user.id];
					}
					if(!unvote){
						channel.send('You have left \"'+event.name+'\" event!');
					}else{
						let date = new Date(event.dates[datePos][0]);
						channel.send('You have cancelled your vote for \"'+date.toUTCString()+'\".')
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
					channel.send('You have been added to the list of people that can\'t attend the event.');
					return JSON.stringify(obj);
				}
			}
			return false;	
		});
	}


	/*
	 * Sets given date as the date for the event.
	 * Notifies all the members interested in the event about the decided date.
	 * Recieves: guild(class), eventPos(int), finalDate(array -> [Date, object]), channel(class)
	 * Returns: string(stringify json)
	*/
	function decideDate(guild, eventPos, finalDate, channel){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			let date = new Date(finalDate[0]);
			let event = obj.guilds[guild.id].events[eventPos];
			event.dates = [finalDate];
			let text = 'Votes closed! Final date for \"'+event.name+'\" is:\n'+date.toUTCString()+'.';
			channel.send(text);
			let members = Object.keys(event.interested);
			for(let i = 0; i < members.length; i++){
				globals.sendDm(client, members[i], 'Server: '+guild.name+'\n'+text);
			}
			scheduleEvent(guild, event);
			return JSON.stringify(obj);
		});
	}


	/*
	 * Gives event's host all the options to choose from to decide a final date for the event.
	 * Sets that date for the event.
	 * Recieves: user(class), guild(class), eventPos(int), channel(class)
	 * Returns: 
	*/
	function closeVotes(user, guild, eventPos, channel){
		fs.readFile(scheduleDb, 'utf8', function(err, data){
			if(err){console.error(err);}else{
				let obj = JSON.parse(data);
				if(hasEvent(obj, channel, guild.id, eventPos)){
					let event = obj.guilds[guild.id].events[eventPos];
					if(event.host[1] !== user.id){
						channel.send('Only the host can close the votings for the date.');
					}else if(event.dates.length === 1){
						channel.send('The date for this event has already been decided.');
					}else{
						let text = 'Choose beetween one of the following dates:\n';
						for(let i = 0; i < event.dates.length; i++){
							let date = new Date(event.dates[i][0]);
							text += (i+1).toString()+'- '+date.toUTCString()+' ('+event.dates[i][1].votes.toString()+' votes)\n';
						}
						let filter = m => ((m.author === user) && function(m){return(!isNaN(m.content) && parseInt(m.content) > 0 && parseInt(m.content) <= event.dates.length);});
						channel.send(text);
						channel.awaitMessages(filter, {max: 1, time: 120000, errors: ['time']}).then(function(m){
							let vote = (m.array())[0].content;
							decideDate(guild, eventPos, event.dates[parseInt(vote)-1], channel);
						}).catch(function(){channel.send('You\'ve ran out of time, try again.');});
					}
				}
			}
		});
	}


	/*
	 * Deletes given date from the scheduleDb.
	 * Recieves: user(class), guildId(string), eventPos(int), channel(class)
	 * Returns: string(stringify json), false(invalid event)
	*/
	function cancelEvent(user, guildId, eventPos, channel){
		globals.editJSON(scheduleDb, function(data){
			let obj = JSON.parse(data);
			if(hasEvent(obj, channel, guildId, eventPos)){
				let event = obj.guilds[guildId].events[eventPos];
				if(user.id !== event.host[1]){
					channel.send('Only the host can cancel the event.');
				}else{
					obj.guilds[guildId].events.splice(eventPos, 1);
					channel.send('\"'+event.name+'\" event has been cancelled!');
					globals.dateTime(client, 'Event cancelled: \"'+event.name+'\"');
					return JSON.stringify(obj);
				}
			}
			return false;
		});
	}
};
