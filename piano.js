(function(_private, _public) {

	_public.Piano = function(options) {
		options 			= options || {};
		options.instrument	= options.instrument || _private.instruments[0];
		if(_private.browserTest) {
			_private.loadAudio(function(){
				_public.addEventListener("keydown", function(event){
					_private.keyDown(options.instrument, event.which.toString());
				}, true);
			});
		}
	};
	
	_public.Piano.isCompatibleBrowser = _private.browserTest;
		
})({
	
	// maps ascii keycodes to notes
	keymap: {
		"81":  "gs", // q
		"65":  "a",  // a
		"87":  "bb", // w
		"83":  "b",  // s
		"68":  "c",  // d
		"82":  "cs", // r
		"70":  "d",  // f
		"85":  "eb", // u
		"74":  "e",  // j
		"75":  "f",  // k
		"79":  "fs", // o
		"76":  "g"   // l
	},
	
	// the instruments that can be used by the piano (first is default)
	instruments: ["piano"],
	
	// all the notes the piano can play
	scale: ["gs","a","b","bb","c","cs","d","e","eb","f","fs","g"],
	
	// the location of instrument data
	dataPath: "instruments",
	
	// used to test if the current browser is capable of using piano
	browserTest: (new Audio()).canPlayType("audio/x-wav").length > 0,
	
	// called to load the audio into memory
	loadAudio: function(callback, i, j, path, queue) {	
		queue = 0;
		this.audio = {};
		for(i in this.instruments) {
			i = this.instruments[i];
			this.audio[i] = {};
			for (j in this.scale) {
				queue++;
				j = this.scale[j];
				path = this.dataPath + "/" + i + "/";
				this.audio[i][j] = new Audio();
				this.audio[i][j].addEventListener("canplaythrough", function(){
					if(--queue === 0) { callback(); }
				}, true);
				this.audio[i][j].src = path + j + ".wav";
				this.audio[i][j].load();
			}
		}
	},
	
	keyDown: function(instrument, key) {
		key = this.keymap[key];
		if(instrument = this.audio[instrument][key]) {
			if(!instrument.paused) {
				instrument.pause();
				instrument.currentTime = 0;
			}
			instrument.play();
		}
	}
	
}, (window || this));