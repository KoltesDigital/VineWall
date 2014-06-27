var conf = require('./conf'),
	express = require('express'),
	nib = require('nib'),
	path = require('path'),
	request = require('request-json'),
	stylus = require('stylus');

var app = module.exports = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals = conf;

app.use(stylus.middleware({
	dest: path.join(__dirname, 'generated'),
	src: __dirname + '/public',
	compile: function(str, path) {
		return stylus(str)
			.set('filename', path)
			.set('compress', true)
			.use(nib())
			.import('nib');
	}
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'generated')));

var vineClient = request.newClient('https://api.vineapp.com/timelines/');

function sortByPostId(a, b) {
	return a.postId - b.postId;
}

app.get('/', function(req, res) {
	if (typeof req.query.popular !== 'undefined')
		res.render('wall', {
			description: 'Popular videos on VineWall.',
			timeline: 'popular',
			title: 'Popular videos'
		});
	else if (req.query.tag)
		res.render('wall', {
			description: 'Videos with tag ' + req.query.tag + ' on VineWall.',
			timeline: 'tags/' + req.query.tag,
			title: 'Tag: ' + req.query.tag
		});
	else if (req.query.user)
		res.render('wall', {
			description: 'Videos of user ' + req.query.user + ' on VineWall.',
			timeline: 'users/' + req.query.user,
			title: 'User: ' + req.query.user
		});
	else
		res.render('index', {
			description: 'Display a grid of Vine videos.'
		});
});

app.get('/get.json', function(req, res) {
	if (req.query.timeline)
		vineClient.get(req.query.timeline, function(err, response, body) {
			if (!err && body.success) {
				var videos = [];
				
				var lastId = req.query.since ? parseInt(req.query.since) : -1;
				
				records = body.data.records;
				records.sort(sortByPostId);
				records.forEach(function(record) {
					if (record.postId > lastId) {
						lastId = record.postId;
						videos.push(record.videoUrl);
					}
				});
				
				if (videos.length > conf.limit)
					videos.length = conf.limit;
				
				if (videos.length)
					res.json({
						last: lastId,
						videos: videos
					});
				else
					res.send(404);
			} else
				res.json(500, body);
		});
	else
		res.send(404);
});

if (require.main === module)
	app.listen(app.get('port'), function(){
		console.log('Vine wall server listening on port %d in %s mode', app.get('port'), app.get('env'));
	});
