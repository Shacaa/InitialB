/*
 * Global functions.
 */

const fs = require('fs');

exports.dateTime = (client, msg = '') => {dateTime(client, msg);};

exports.botLog = (client, msg = '', print = true) => {dateTime(client, msg, print);};

exports.editJSON = (path, editCallback, args = []) => {editJSON(path, editCallback, args);};

exports.sendDm = (client, userId, msg) => {sendDm(client, userId, msg);};

exports.run = (client, reddit, spotify, message, args) => {
	dateTime(client, ' ');
};


/*
 *Prints actual time and date with an optional message.
 *Also sends the message to a log's channel in owner's server.
 *recieves: message(string)
 *returns:
*/
function dateTime(client, msg = ''){
	var t = new Date();
	console.log(t.toUTCString()+' - '+msg);
	botLog(client, msg, false);
	
}


/*
 * Sends log message to a log's channel in owner's guild.
 * By default also prints log message on console.
 * Recieves: msg(string)
 * Returns: 
*/
function botLog(client, msg = '', print = true){
	var guild = client.guilds.get('194251927305846784');
	var logChannel = guild.channels.get('453389664360071168');
	logChannel.send(msg);
	if(print){console.log(msg);}	
}


/*
 * Edits json files applying giving function. The json(stringify) will be given as last argument to the callback function, so write the function around that.
 * recieves: .json path(string), callback function(function), additional arguments used by callback function(array)
 * returns: boolean depending on if it was saved or not.
 * editCallback returns: must return the json(stringify) with the changes made.
*/
function editJSON(path, editCallback, args = []){
	fs.readFile(path, 'utf8', function(err, data){
		if(err){console.log(err);}else{
			args.push(data);
			json = editCallback.apply(this, args);
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
 * Sends dm with given message to given user.
 * recieves: discord client, userId(string), message(string or richEmbed)
 * returns:
 */
function sendDm(client, userId, message){
	client.fetchUser(userId).then(function(data){
		data.createDM().then(function(dm){dm.send(message);}, function(err){if(err){console.error(err);}});
	}, function(err){if(err){console.error(err);}});	
}
