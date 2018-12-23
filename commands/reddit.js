/*
 * Reddit command.
 */

const globals = require('./globals.js');


exports.run = (client, reddit, spotify, message, args) => {

	sendRandomSubmLink(args[0], message.channel);


//////////////////FUNCTIONS/////////////////////


	/*
	 *Sends the link from a random submission to message's channel.
	 *recieves: subreddit(string), message(object)
	 *returns: link(string)
	*/
	function sendRandomSubmLink(sub = 'all', channel){
		try{
			globals.dateTime(client, 'empezando a conseguir datos');
			reddit.getHot(sub, {limit: 50}).then(function(posts){
				globals.dateTime(client, 'datos conseguidos');
				var subm = Math.floor((Math.random()*50)+1);
				if(posts[subm.toString()]['over_18']){
					if(sub == 'all'){sendRandomSubmLink(sub, channel);}else{
						reddit.getSubreddit(sub).fetch().then(function(data){
							if(!data.over18){sendRandomSubmLink(sub, channel);}else{
								channel.send('NSFW subreddits are not accepted, if you think this one should be an exception say so with \"+-report\".');
								return false;
							}
						});
					}
				}else{
					channel.send(posts[subm.toString()]['title']+'\n'+posts[subm.toString()]['url']);
					globals.dateTime(client, 'datos enviados');
				}
			});
		}catch(err){
			channel.send('Check that the subreddit that you have entered is valid.');
			console.log(err);
		}
	}
};
