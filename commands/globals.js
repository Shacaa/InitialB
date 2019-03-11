/*
 * Global functions.
 */

const fs = require('fs');
const schedule = require('node-schedule');
const botInfo = require('../files/botInfo.json');

exports.dateTime = (message = '') => dateTime(message);

exports.botLog = (client, message = '') => botLog(client, message);

exports.sendDm = (client, userId, message) => sendDm(client, userId, message);

exports.editJSON = (path, editCallback, args = []) => editJSON(path, editCallback, args);

exports.cancelAllScheduledJobs = () => cancelAllScheduledJobs();

exports.sendMessage = (channel, message) => {
	return new Promise((resolve, reject) => sendMessage(channel, message, resolve, reject));
};

exports.editJSONwPromise = (path, editCallback, args = []) => {
	return new Promise((resolve, reject) => {
		editJSONwPromise(path, resolve, reject, editCallback, args);
	});
};



/*
 *Prints actual date and time with an optional message on console.
 *recieves: message(string)
 *returns:
*/
function dateTime(message = ''){
	let t = new Date();
	console.log(t.toUTCString() + ' - ' + message);
}


/*
 * Sends log message to a log's channel in owner's guild.
 * Also prints log message with actual time on console.
 * Recieves: client(class), msg(string)
 * Returns: 
*/
function botLog(client, message = ''){
	let guild = client.guilds.get(botInfo.owner.guild);
	if(!guild){
		console.error(guild);
		dateTime("couldn't connect to guild to send log message")
	}else{
		let logChannel = guild.channels.get(botInfo.owner.logChannel);
		sendMessage(logChannel, message);
		dateTime(message);
	}
}


/*
 * Edits json files applying giving function. The json(stringify) will be given as last argument to the callback function, so write the function around that.
 * recieves: path(string), editCallback(function), args(array)
 * returns: boolean
 * editCallback returns: json(stringify)
*/
function editJSON(path, editCallback, args = []){
	fs.readFile(path, 'utf8', function(err, data){
		if(err){console.log(err);}else{
			args.push(data);
			let json = editCallback.apply(this, args);
			if(!json){return false;}
			fs.writeFile(path, json, 'utf8', function(err){
				if(err){console.log(err);}else{
					console.log('Saved');
				}
			});
		}
	});
}


/*
* Just like editJson but returns results through resolve/reject functions, this way is possible to use it with promises.
* recieves: path(string), resolve(function), reject(function), editCallback(function), args(array)
* returns:
*/
function editJSONwPromise(path, resolve, reject, editCallback, args = []){
	fs.readFile(path, 'utf8', function(err, data){
		if(err){reject(err);}else{
			args.push(data);
			let json = editCallback.apply(this, args);
			if(!json){reject('error at edit');}
			fs.writeFile(path, json, 'utf8', function(err){
				if(err){reject(err);}else{
					resolve('Saved');
				}
			});
		}
	});
}


/*
 * Sends dm with given message to given user.
 * recieves: client(class), userId(string), message(string or richEmbedObject)
 * returns:
 */
function sendDm(client, userId, message){
	client.fetchUser(userId)
		.then(user => user.createDM()
			.then(dm => dm.send(message).catch(err => console.error(err)))
			.catch(err => console.error(err)))
		.catch(err => console.error(err));
}


/*
* Sends (embed)message to given text channel.
* Can be used as if it returns a promise.
* recieves: channel(class), message(string/object), resolve(function), reject(function)
* returns:
*/
function sendMessage(channel, message, resolve, reject){
	channel.send(message)
		.then(response => resolve && resolve(response))
		.catch(err => {
			console.error(err);
			reject && reject(err);
		});
}


/*
* Cancels all jobs scheduled by node-schedule.
* recieves:
* returns:
*/
function cancelAllScheduledJobs(){
	let scheduledJobs = schedule.scheduledJobs;
	let jobNames = Object.keys(scheduledJobs);
	for(let i = 0; i < jobNames.length; i++){
		scheduledJobs[jobNames[i]].cancel();
	}
	dateTime('All scheduled jobs canceled');
}