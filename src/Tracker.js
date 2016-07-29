var Tracker = (function() {
	var map;
	
	var bindFunctions = function() {

	};

	var init = function() {
		map = Map.init();
		bindFunctions();
	};

	return {
		init: init
	};

})();


$(function() {
	Tracker.init();
});
