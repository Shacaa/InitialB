/*
 * Reddit command.
 */

const globals = require('./globals.js');


exports.run = (client, reddit, spotify, message, args) => {

	sendRandomSubmLink(client, reddit, args[0], message.channel);

};



/*
 *Sends the link of a random submission from given subreddit's frontpage to message's channel.
 *recieves: subreddit(string), message(object)
 *returns: link(string)
*/
function sendRandomSubmLink(client, reddit, sub = 'all', channel){
	try{
		globals.botLog(client, 'empezando a conseguir datos');
		reddit.getHot(sub, {limit: 50}).then(function(posts){
			globals.botLog(client, 'datos conseguidos');
			let subm = Math.floor((Math.random()*50)+1);
			if(posts[subm.toString()]['over_18']){
				if(sub === 'all'){sendRandomSubmLink(sub, channel);}else{
					reddit.getSubreddit(sub).fetch().then(function(data){
						if(!data.over18){sendRandomSubmLink(sub, channel);}else{
							globals.sendMessage(channel, 'NSFW subreddits are not accepted, if you think this one should be an exception say so with \"+-report\".');
							return false;
						}
					});
				}
			}else{
				globals.sendMessage(channel, posts[subm.toString()]['title']+'\n'+posts[subm.toString()]['url']);
				globals.botLog(client, 'datos enviados');
			}
		});
	}catch(err){
		globals.sendMessage(channel, 'Check that the subreddit that you have entered is valid.');
		console.log(err);
	}
}
