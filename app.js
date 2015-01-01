var config = require('config-path')(__dirname + "/config.yml"),
	express = require('express'),
	nib = require('nib'),
	path = require('path'),
	request = require('request-json'),
	stylus = require('stylus');

var app = module.exports = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals = config;

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
	var interval = req.query.interval || config.interval;
	var rows = req.query.rows || '';
	var columns = req.query.columns || '';
	
	if (typeof req.query.popular !== 'undefined')
		res.render('wall', {
			columns: columns,
			description: 'Popular videos on ' + config.siteName + '.',
			interval: interval,
			rows: rows,
			timeline: 'popular',
			title: 'Popular videos'
		});
	else if (req.query.tag)
		res.render('wall', {
			columns: columns,
			description: 'Videos with tag ' + req.query.tag + ' on ' + config.siteName + '.',
			interval: interval,
			rows: rows,
			timeline: 'tags/' + req.query.tag,
			title: 'Tag: ' + req.query.tag
		});
	else if (req.query.user)
		res.render('wall', {
			columns: columns,
			description: 'Videos of user ' + req.query.user + ' on ' + config.siteName + '.',
			interval: interval,
			rows: rows,
			timeline: 'users/' + req.query.user,
			title: 'User: ' + req.query.user
		});
	else
		res.render('index', {
			description: 'Display a grid of Vine videos.'
		});
});

app.get('/get.json', function(req, res) {
	var n = parseInt(req.query.n);
	if (req.query.timeline && n > 0) {
		var videos = [];
		var since = req.query.since ? parseInt(req.query.since) : -1;
		var lastId;
		
		function sendVideos() {
			if (videos.length) {
				if (videos.length > n)
					videos.length = n;
				
				videos.reverse();
				
				res.json({
					last: lastId,
					videos: videos
				});
			} else
				res.send(404);
		}
		
		function getPage(index) {
			vineClient.get(req.query.timeline + '?page=' + index, function(err, response, body) {
				if (!err && body.success) {
					var records = body.data.records;
					if (records.length) {
						if (index === 1)
							lastId = records[0].postId;
						
						var added = 0;
						records.forEach(function(record) {
							if (record.postId > since) {
								videos.push(record.videoUrl);
								++added;
							}
						});
						
						if (added === records.length && videos.length < n && body.data.nextPage)
							getPage(body.data.nextPage);
						else
							sendVideos();
					} else
						sendVideos();
				} else
					res.json(500, body);
			});
		}
		
		getPage(1);
	} else
		res.send(400);
});

if (require.main === module)
	app.listen(app.get('port'), function(){
		console.log('Vine wall server listening on port %d in %s mode', app.get('port'), app.get('env'));
	});
