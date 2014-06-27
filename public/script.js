(function($) {
	var $videos = $('#videos');
	if ($videos.length) {
		var interval = parseInt($videos.data('interval')) * 1000;
		var limit = parseInt($videos.data('limit'));
		
		var $window = $(window);
		
		var query = {
			timeline: $videos.data('timeline')
		};
		
		$window.resize(function() {
			var windowHeight = window.innerHeight;
			var rows = Math.round(windowHeight / 480);
			$videos.children().width(windowHeight / rows);
		});
		
		function showVideos() {
			$.getJSON('/get.json', query, function(data) {
				$.each(data.videos, function() {
					$videos.prepend($('<video autoplay muted loop preload="auto" poster></video>').attr('src', this));
				});
				$videos.children().slice(limit).remove();
				$window.resize();
				
				query.since = data.last;
				setTimeout(showVideos, interval);
			}).fail(function() {
				setTimeout(showVideos, interval);
			});
		}
		
		showVideos();
	}
})(jQuery);