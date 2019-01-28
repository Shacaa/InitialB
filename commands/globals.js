/*
 * Global functions.
 */

const fs = require('fs');

exports.dateTime = (client, msg = '') => {dateTime(client, msg);};

exports.botLog = (client, msg = '', print = true) => {botLog(client, msg, print);};

exports.editJSON = (path, editCallback, args = []) => {editJSON(path, editCallback, args);};

exports.editJSONwPromise = (path, editCallback, args = []) => {editJSONwPromise(path, editCallback, args);};

exports.sendDm = (client, userId, msg) => {sendDm(client, userId, msg);};

exports.run = (client, reddit, spotify, message, args) => {
	dateTime(client, ' ');
};


/*
 *Prints actual time and date with an optional message.
 *Also sends the message to a log's channel in owner's server.
 *recieves: client(class), message(string)
 *returns:
*/
function dateTime(client, msg = ''){
	let t = new Date();
	console.log(t.toUTCString()+' - '+msg);
	botLog(client, msg, false);
}


/*
 * Sends log message to a log's channel in owner's guild.
 * By default also prints log message on console.
 * Recieves: client(class), msg(string), print(boolean)
 * Returns: 
*/
function botLog(client, msg = '', print = true){
	let guild = client.guilds.get('194251927305846784');
	let logChannel = guild.channels.get('453389664360071168');
	logChannel.send(msg);
	if(print){dateTime(client, msg);}
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


function editJSONwPromise(path, editCallback, args = []){
	return new Promise((resolve, reject) => {
		fs.readFile(path, 'utf8', function(err, data){
			if(err){reject(err)}else{
				args.push(data);
				let json = editCallback.apply(this, args);
				if(!json){reject("Error editing json.")}
				fs.writeFile(path, json, 'utf8', function(err){
					if(err){reject(err)}else{
						console.log('Saved');
						resolve(json);
					}
				});
			}
		});
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
