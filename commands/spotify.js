/*
 * Spotify command.
 */

const globals = require('./globals.js');


exports.run = (client, reddit, spotify, message, args) => {

	var artist = args.join(' ');
	randomArtistSong(artist, message);	


//////////////////FUNCTIONS/////////////////////


	/*
	 * Sends on channel random song from given artist id.
	 * recieves: id(string), message(object), offset(number), albums(array)
	 * returns:
	 */
	function randomSong(id, message, from = 0, albums = []){
		spotify.getArtistAlbums(id, {album_type:'album,single', offset:from, limit:50}).then(function(data){
			albums = albums.concat(data.body.items);
			if(albums.length%50 == 0){
					if(albums.length == 0){
						message.channel.send('No music found :(\nTry again or with another artist.');
						return false;
					}
					globals.botLog(client, 'desde: '+from+'\ncant de albums: '+albums.length);
					randomSong(id, message, from += 50, albums);
			}else{
				globals.botLog(client, 'cant final: '+albums.length);
				var randPos = Math.floor((Math.random()*(albums.length-1))+1);
				globals.botLog(client, 'id del album '+randPos.toString()+': '+albums[randPos]['id']);
				spotify.getAlbumTracks(albums[randPos]['id'], {limit:50}).then(function(data){
					var len = data.body['items'].length;
					var number = Math.floor((Math.random()*(len-1))+1);
					if(len == 1){number = 0;}
					globals.botLog(client, 'id cancion: '+data.body.items[number]['id']);
					message.channel.send('https://open.spotify.com/track/'+data.body.items[number]['id']);
				}, function(err){console.error(err);});
			}
		}, function(err){console.error(err);});
		
	}


	/*
	 * Searches id of given artist name and sends on channel random song from him.
	 * recieves: artist name(string), message(object)
	 * returns:
	 */
	function randomArtistSong(name, message){
		spotify.search(name, ['artist'], {limit: 2}).then(function(data){
			if(data.body.artists.items.length == 0){
				message.channel.send('No results for \''+name+'\'.');
				return;
			}
			globals.botLog(client, data.body.artists['items'][0]['id']);
			return data.body.artists['items'][0]['id'];
		}, function(err){console.error(err);}).then(function(data){
			randomSong(data, message);
		}, function(err){console.error(err);});
	}
};
