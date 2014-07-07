(function($) {
	var $videos = $('#videos');
	if ($videos.length) {
		var interval = parseInt($videos.data('interval')) * 1000;
		var staticColumns = parseInt($videos.data('columns'));
		var staticRows = parseInt($videos.data('rows'));
		var videos = 0;
		
		var $window = $(window);
		
		var tetrisRng = new TetrisRNG(0.5);
		
		var query = {
			timeline: $videos.data('timeline')
		};
		
		$window.resize(function() {
			var windowHeight = window.innerHeight;
			var windowWidth = window.innerWidth;
			
			var columns = staticColumns;
			var rows = staticRows;
			var size;
			
			if (!columns && !rows) {
				columns = Math.round(windowWidth / 480);
				rows = Math.round(windowHeight / 480);
			}
			
			if (columns && rows) {
				if (rows / columns < windowHeight / windowWidth)
					size = Math.floor(windowWidth / columns);
				else
					size = Math.floor(windowHeight / rows);
			} else if (columns) {
				size = Math.floor(windowWidth / columns);
				rows = Math.floor(windowHeight / size);
			} else {
				size = Math.floor(windowHeight / rows);
				columns = Math.floor(windowWidth/ size);
			}
			
			$videos.children('video').width(size);
			videos = rows * columns;
			query.n = videos;
			
			var removedVideos = $videos.children('video').slice(videos).remove();
			removedVideos.each(function() {
				tetrisRng.remove(this);
			});
			
			$videos.children('br').remove();
			$videos.children('video').each(function(i) {
				if (i && i % columns === 0)
					$(this).before('<br/>');
			});
		}).resize();
		
		function showVideos() {
			function update() {
				$videos.children('video').prop('muted', true).removeClass('unmuted');
				$(tetrisRng.random()).removeAttr('muted').prop('muted', false).addClass('unmuted');
				setTimeout(showVideos, interval);
			}
		
			$.getJSON('/get.json', query, function(data) {
				$.each(data.videos, function() {
					var video = $('<video autoplay muted loop preload="auto" poster></video>').attr('src', this);
					tetrisRng.add(video[0]);
					$videos.prepend(video);
				});
				$window.resize();
				
				if (!query.since)
					tetrisRng.shuffle();
				query.since = data.last;
				
				update();
			}).fail(update);
		}
		
		showVideos();
	}
})(jQuery);