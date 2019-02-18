/*
 * Global functions.
 */

const fs = require('fs');

exports.dateTime = (message = '') => dateTime(message);

exports.botLog = (client, message = '') => botLog(client, message);

exports.sendDm = (client, userId, message) => sendDm(client, userId, message);

exports.sendMessage = (channel, message) => sendMessage(channel, message);

exports.editJSON = (path, editCallback, args = []) => editJSON(path, editCallback, args);

exports.editJSONwPromise = (path, editCallback, args = []) => {
	return new Promise((resolve, reject) => {
		editJSONwPromise(path, resolve, reject, editCallback, args);
	});
};



/*
 *Prints actual date and time with an optional message on console.
 *recieves: client(class), message(string)
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
	let guild = client.guilds.get('194251927305846784');
	let logChannel = guild.channels.get('453389664360071168');
	sendMessage(logChannel, message);
	dateTime(client, message);
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
	client.fetchUser(userId).then(function(data){
		data.createDM().then(function(dm){dm.send(message);}, function(err){if(err){console.error(err);}});
	}, function(err){if(err){console.error(err);}});	
}


/*
* Sends (embed)message to given text channel.
* recieves: channel(class), message(string/object)
* returns:
*/
function sendMessage(channel, message){
	channel.send(message)
		.catch(err => console.error(err));
}
