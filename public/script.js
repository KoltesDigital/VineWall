(function($) {
	var $videos = $('#videos');
	if ($videos.length) {
		var interval = parseInt($videos.data('interval')) * 1000;
		var limit = parseInt($videos.data('limit'));
		var staticRows = parseInt($videos.data('rows'));
		var videos = 0;
		
		var $window = $(window);
		
		var tetrisRng = new TetrisRNG(0.5);
		
		var query = {
			timeline: $videos.data('timeline')
		};
		
		$window.resize(function() {
			var windowHeight = window.innerHeight;
			var rows = staticRows || Math.round(windowHeight / 480);
			var height = Math.floor(windowHeight / rows);
			$videos.children().width(height);
			
			videos = Math.min(limit, rows * Math.floor(window.innerWidth / height));
			var removedVideos = $videos.children().slice(videos).remove();
			removedVideos.each(function() {
				tetrisRng.remove(this);
			});
		});
		
		function showVideos() {
			function update() {
				$videos.children().prop('muted', true).removeClass('unmuted');
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