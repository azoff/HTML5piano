/*!
 * Piano v1.0.0
 *  A JavaScript implementation of a simple keyboard using HTML5 technologies.
 *  http://azoffdesign.com/piano
 *
 * Copyright 2010, Jonathan Azoff
 *  Freely distributable contigent to the terms of the DBAD license:
 *  http://github.com/SFEley/candy/blob/master/LICENSE.markdown
 *
 * Date: Sunday, April 11th 2010
 */

/*jslint onevar: true, strict: true, browser: true */
/*global window, Audio */
"use strict"; 

(function(_private, _public) {

	_public.Piano = {
		
		/**
		 * A set of constants intended to be used at the argument to the default Piano factory, createInstance. These
		 * constants define a set of instrument voices the Piano instance can be bound to.
		 */
		Voice: {

			/**
			 * A grand piano
			 */
			GRAND_PIANO: "grandPiano" 

		},
		
		/**
		 * The audio type that the current browser supports for HTML5 Audio Elements.
		 * @see http://html5doctor.com/native-audio-in-the-browser/
		 */
		audioType: _private.getAudioType(),
		
		/**
		 * The factory for creating tangible DOM instances of the Piano.
		 * @param {String} instrument The name of the instrument voice to use for the generated instance of the Piano.
		 * @returns An instance of the Piano bound to a particular instrument voice. 
		 * @public 
		 * @constructor
		 */
		createInstance: function(instrument, canvas) {
			if(this.audioType) {
				canvas = _private.getPianoCanvas();
				canvas.audio = _private.loadAudio(instrument, this.audioType, function(){
					canvas.addEventListener("mousedown", function(event){
						canvas.mouse = { x: event.clientX-7, y: event.clientY-7 };
						canvas.drawPiano();
					}, true);
					canvas.addEventListener("mouseup", function(event){
						canvas.mouse = null;
						canvas.drawPiano();
					}, true);
					canvas.addEventListener("mouseover", function(){
						canvas.active = true;
						canvas.drawPiano();
					}, true);
					canvas.addEventListener("mouseout", function(){
						canvas.mouse = null;
						canvas.active = false;
						canvas.drawPiano();
					}, true);
					_public.addEventListener("keydown", function(event, key){
						key = event.which.toString();
						if(canvas.active && canvas.keymap.hasOwnProperty(key)) {
							key = canvas.keymap[key];
							canvas.keyTargets[key] = true;
							canvas.press(key);
							canvas.drawPiano();
						}
					}, true);
					_public.addEventListener("keyup", function(event, key){
						key = event.which.toString();
						if(canvas.keymap.hasOwnProperty(key)) {
							key = canvas.keymap[key];
							if(canvas.keyTargets[key]) {
								canvas.keyTargets[key] = false;
								canvas.release(key);
								canvas.drawPiano();
							}
						}
					}, true); 
					canvas.drawPiano();
				});
				return canvas;
			}
		}
		
	};
		
})({
	
	// maps ascii keycodes to notes
	keymap: {
		"87":  "gs", // w
		"83":  "a",  // s
		"69": "bb",  // e
		"68":  "b",  // d
		"70":  "c",  // f
		"84":  "cs", // t
		"71":  "d",  // g
		"89":  "eb", // y
		"72":  "e",  // h
		"74":  "f",  // j
		"73":  "fs", // i
		"75":  "g"   // k
	},

	// all the notes the piano can play
	scale: ["gs","a","bb","b","c","cs","d","eb","e","f","fs","g"],
	
	// the audio mime types supported by piano
	supportedTypes: { "audio/x-wav": ".wav", "audio/wav": ".wav", "audio/ogg": ".ogg" },
	
	// the location of instrument data
	dataPath: "instruments",
	
	// used to test if the current browser is capable of using piano
	getAudioType: function(test, result) {
		if (typeof Audio !== "undefined") {
			test = new Audio("");
			for (var mime in this.supportedTypes) {
				if(this.supportedTypes.hasOwnProperty(mime)) {
					result = test.canPlayType(mime);
					if(result !== "" && result !== "no") {
						return this.supportedTypes[mime];
					}
				}
			}
		}
		return null;
	},
	
	// gets the piano canvas
	getPianoCanvas: function(canvas, context) {
		canvas				= document.createElement("canvas");
		canvas.style.width	= "100px";
		canvas.style.height	= "100px";
		canvas.keyTargets	= {};
		canvas.active		= false;
		canvas.scale		= this.scale;
		canvas.keymap		= this.keymap;
		canvas.drawPiano	= this.drawPiano;
		canvas.press		= this.press;
		canvas.release		= this.release;
		return canvas;
	},
	
	drawPiano: function(context, i, key, coords, last) {
		
		// get the piano coordinates
		coords = { 
			white: { 
				index: 0, 
				keys: [], 
				dx: 8,
				width: 12,
				height: 60,
				top: 30
			}, 
			black: { 
				index: 0, 
				keys: [], 
				dx: 5,
				width: 7,
				height: 33,
				top: 30
			}, 
			bg: {
				width: 100,
				height: 100
			},
			title: {
				top: 20,
				left: 6
			}, 
			active: {
				top: 1,
				left: 94,
				width: 5,
				height: 5
			}
		};
		
		// setup stage
		this.width = coords.bg.width;
		this.height = coords.bg.height;
		context = this.getContext("2d");
		
		// draw background
		context.fillStyle = "#8A4B08";
		context.strokeStyle = "#000";
		context.fillRect(0, 0, coords.bg.width, coords.bg.height);
		context.strokeRect(0, 0, coords.bg.width, coords.bg.height);
		
		// draw title
		context.fillStyle = "#FFF";
		context.font = "13px 'Times New Roman', Times";
		context.fillText("HTML5 PIANO", coords.title.left, coords.title.top);
		
		if(this.mouseTarget && !this.keyTargets[this.mouseTarget]) { 
			this.release(this.mouseTarget);
			this.mouseTarget = null;
		}
		
		for (i=0;i<this.scale.length;i++) {
			key = this.scale[i];
			if (key.length == 1) {
				if(this.mouse && !this.mouseTarget && 
					this.mouse.x >= coords.white.dx &&
					this.mouse.x <= coords.white.dx+coords.white.width &&
					this.mouse.y >= coords.white.top &&
					this.mouse.y <= coords.white.top+coords.white.height) {
						this.press(this.mouseTarget = key);
				}
				coords.white.keys.push({
					x: coords.white.dx, 
					pressed: (this.keyTargets[key] || this.mouseTarget == key)
				});
				coords.white.dx += coords.white.width; 
				if(last === "w") { coords.black.dx += coords.white.width; }
				last = "w";
			} else {
				if(this.mouse && !this.mouseTarget && 
					this.mouse.x >= coords.black.dx &&
					this.mouse.x <= coords.black.dx+coords.black.width &&
					this.mouse.y >= coords.black.top &&
					this.mouse.y <= coords.black.top+coords.black.height) {
						this.press(this.mouseTarget = key);
				}
				coords.black.keys.push({
					x: coords.black.dx, 
					pressed: (this.keyTargets[key] || this.mouseTarget == key)
				});
				coords.black.dx += coords.white.width;
				last = "b";
			} 
			
		}
		
		// draw the white keys
		for (i=0;i<coords.white.keys.length;i++) {
			key = coords.white.keys[i];
			context.fillStyle = key.pressed ? "#CCC" : "#FFF";
			context.strokeStyle = "#000";
			context.fillRect(key.x, coords.white.top, coords.white.width, coords.white.height);
			context.strokeRect(key.x, coords.white.top, coords.white.width, coords.white.height);
		}
		
		// draw the black keys
		for (i=0;i<coords.black.keys.length;i++) {
			key = coords.black.keys[i];
			context.fillStyle = key.pressed ? "#CCC" : "#000";
			context.fillRect(key.x, coords.black.top, coords.black.width, coords.black.height);
		}
		
		// draw the active indicator
		context.fillStyle = this.active ? "#0F0" : "#F00";
		context.strokeStyle = "#000";
		context.fillRect(coords.active.left, coords.active.top, coords.active.width, coords.active.height);
		context.strokeRect(coords.active.left, coords.active.top, coords.active.width, coords.active.height);
	
	},
	
	// called to load the audio into memory
	loadAudio: function(instrument, type, callback, audio, key, path, queue,i) {	
		queue = 0; audio = {};
		for (i=0;i<this.scale.length;i++) {
			queue++;
			key			= this.scale[i];
			path		= this.dataPath + "/" + instrument + "/";
			audio[key]	= new Audio("");
			audio[key].addEventListener("canplaythrough", (function(key){
				return function onCanPlay() {
					key.removeEventListener("canplaythrough", onCanPlay, true);
					if(--queue === 0) { callback(); }
				};
			})(audio[key]), true);
			audio[key].src = path + key + type;
			audio[key].load();
		}
		return audio;
	},
	
	// emulates pressing a key
	press: function(key) {
		key = this.audio[key];
		if(!key.pressed) {
			key.pause();
			key.load();				
			key.play();
			key.pressed = true;
		}
	},
	
	// emulates releasing a key
	release: function(key) {
		this.audio[key].pressed = false;
	}
	
}, window);