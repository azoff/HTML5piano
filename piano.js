(function(_private, _public) {

	_public.Piano = {
		
		Voice: {

			GRAND_PIANO: "grandPiano" 

		},
		
		audioType: _private.getAudioType(),
		
		createInstance: function(instrument, canvas) {
			if(this.audioType) {
				canvas = _private.getPianoCanvas();
				canvas.audio = _private.loadAudio(instrument, this.audioType, function(){
					_public.addEventListener("keydown", function(event){
						_private.keyDown(canvas.audio, event.which.toString());
					}, true);
					_public.addEventListener("keyup", function(event){
						_private.keyUp(canvas.audio, event.which.toString());
					}, true);
				});
				return canvas;
			}
		}
		
	};
		
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
	
	// all the notes the piano can play
	scale: ["gs","a","b","bb","c","cs","d","e","eb","f","fs","g"],
	
	// the audio mime types supported by piano
	supportedTypes: { "audio/x-wav": ".wav", "audio/wav": ".wav", "audio/ogg": ".ogg" },
	
	// the location of instrument data
	dataPath: "instruments",
	
	// used to test if the current browser is capable of using piano
	getAudioType: function(mime, test, result) {
		if (typeof Audio !== "undefined") {
			test = new Audio("");
			for (mime in this.supportedTypes) {
				result = test.canPlayType(mime);
				if(result !== "" && result !== "no") {
					return this.supportedTypes[mime];
				}
			}
		}
		return null;
	},
	
	// gets the piano canvas
	getPianoCanvas: function() {
		return document.createElement("canvas");
	},
	
	// called to load the audio into memory
	loadAudio: function(instrument, type, callback, audio, key, path, queue) {	
		queue = 0; audio = {}
		for (key in this.scale) { 
			queue++;
			key 		= this.scale[key];
			path 		= this.dataPath + "/" + instrument + "/";
			audio[key] 	= new Audio("");
			audio[key].addEventListener("canplaythrough", function onCanPlay(){
				audio[key].removeEventListener("canplaythrough", onCanPlay, true);
				if(--queue === 0) { callback(); }
			}, true);
			audio[key].src = path + key + type;
			audio[key].load();
		}
		return audio;
	},
	
	// emulates pressing a key
	keyDown: function(audio, key) {
		if(audio && this.keymap.hasOwnProperty(key)) {
			key = audio[this.keymap[key]];
			if(!key.pressed) {
				key.pause();
				key.load();				
				key.play();
				key.pressed = true;
			}
		}
	},
	
	// emulates releasing a key
	keyUp: function(audio, key) {
		if(audio && this.keymap.hasOwnProperty(key)) {
			audio[this.keymap[key]].pressed = false
		}
	}
	
}, (window || this));