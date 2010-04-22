/*!
 * Piano v1.0.0
 *  A JavaScript implementation of a simple keyboard using HTML5 technologies.
 *  http://azoffdesign.com/piano
 *
 * Copyright 2010, Jonathan Azoff
 *  Freely distributable under the terms outlined in the DBAD license:
 *  http://github.com/SFEley/candy/blob/master/LICENSE.markdown
 *
 * Date: Sunday, April 12th 2010
 *
 * For usage examples and API documentation, see azoffdesign.com/piano 
 *
 */

/*jslint onevar: true, strict: true, browser: true */
/*global window, Audio, HTMLAudioElement */
"use strict";
(function(_public, _private){
	
	_public.Piano = {
		
		Voices: {
			
			GRAND_PIANO: "grandPiano"
			
		},
		
		createInstance: function(options, colors, reqs) {
			
			colors = { 
				black: "#000", 
				white: "#FFF", 
				brown: "#8A4B08", 
				green: "#0F0", 
				red: "#F00", 
				gray: "#DDD",
				darkGray: "#333"
			};
			
			options						= options || {};
			options.height				= options.height || 100;
			options.width				= options.width || 100;
			options.backgroundFill		= options.backgroundFill || colors.brown;
			options.backgroundStroke	= options.backgroundStroke || colors.black;
			options.whiteKeyFill		= options.whiteKeyFill || colors.white;
			options.whiteKeyStroke		= options.whiteKeyStroke || colors.darkGray;
			options.blackKeyFill		= options.blackKeyFill || colors.black;
			options.blackKeyStroke		= options.blackKeyStroke || colors.darkGray;
			options.activeKeyFill		= options.activeKeyFill || colors.gray;
			options.activeKeyStroke		= options.activeKeyStroke || colors.black;
			options.titleColor			= options.titleColor || colors.white;
			options.titleFont			= options.titleFont || "'Times New Roman', Times";
			options.powerOnFill			= options.powerOnFill || colors.green;
			options.powerOnStroke		= options.powerOnStroke || colors.black;
			options.powerOffFill		= options.powerOffFill || colors.red;
			options.powerOffStroke		= options.powerOffStroke || colors.black;			
			
			reqs = _private.Piano.getRequirements(_public.document);
			
			if(reqs) {
				options.voice		= options.voice || _public.Piano.Voices.GRAND_PIANO;
				options.extension	= _private.Piano.getAudioExtension(reqs.audio);
				return options.extension ? _private.Piano(options, reqs.canvas) : null;
			}
			
			return null;
		}
		
	};
	
	_private.Piano = function(options, canvas) {
		canvas.style.width	= options.width + "px";
		canvas.style.height = options.height + "px";
		canvas.width		= options.width;
		canvas.height		= options.height;
		canvas.mouseTarget	= null;
		canvas.pianoBg		= new _private.Piano.Background(options);
		canvas.pianoPower	= new _private.Piano.Power(options);
		canvas.pianoTitle	= new _private.Piano.Title(options);
		canvas.pianoKeys	= _private.Piano.Key.loadKeys(options, _private.Piano.onKeysLoaded(canvas));
		canvas.drawPiano	= _private.Piano.drawPiano;
		
		return canvas;
	};
	
	_private.Piano.extendAudioElement = function(version) {
	
		if(!HTMLAudioElement.prototype.stop) {
			// add stop() to prototype for audio
			HTMLAudioElement.prototype.stop = function() { this.pause(); this.currentTime=0; };

			// TODO: This is a hack because Chrome does not properly implement the MediaElement.currentTime
			//		 attribute and there is no way to check for this bug in a browser agnostic way. So far,
			//		 any version of chrome that supports <audio> and is of version 5.0.342 or earlier is failing.
			version = /Chrome\/([^ ]*) /.exec(navigator.userAgent);
			if (version && version.length == 2) {
				version = version[1].toString().split(".", 3);
				if (version.length > 2 && (
						parseInt(version[0], 10) < 5 ||
						parseInt(version[1], 10) < 0 ||
						parseInt(version[2], 10) <= 342 )) {
					HTMLAudioElement.prototype.stop = HTMLAudioElement.prototype.load;
				}
			}
		}
		
	};

	_private.Piano.getRequirements = function(doc, audio, canvas) {
		audio = new Audio("");
		canvas = doc.createElement('canvas');
		if( !!(audio.play) && !!(canvas.getContext) ) {
			_private.Piano.extendAudioElement();
			return { audio: audio, canvas: canvas };
		} else {
			return null;
		}
	};
	
	_private.Piano.onKeysLoaded = function(instance) {
		return function() {
			_private.Piano.attachListeners(instance);
			instance.drawPiano();
		};
	};
	
	_private.Piano.attachListeners = function(canvas) {
		canvas.addEventListener("mousedown", function(event, point){
			point = { x: event.clientX-7, y: event.clientY-7 };
			if (canvas.mouseTarget) {
				canvas.mouseTarget.release();
				canvas.mouseTarget = null;
			}
			for (var key in canvas.pianoKeys) {
				if((canvas.pianoKeys[key] instanceof _private.Piano.Key) && canvas.pianoKeys[key].isMouseHit(point.x, point.y)) {
					canvas.pianoKeys[key].press();
					canvas.mouseTarget = canvas.pianoKeys[key];
					break;
				}
			} 
			canvas.drawPiano();
		}, true);
		canvas.addEventListener("mouseup", function(event){
			if (canvas.mouseTarget) {
				canvas.mouseTarget.release();
				canvas.mouseTarget = null;
			}
			canvas.drawPiano();
		}, true);
		canvas.addEventListener("mouseover", function(){
			canvas.pianoPower.on = true;
			canvas.drawPiano();
		}, true);
		canvas.addEventListener("mouseout", function(){
			canvas.pianoPower.on = false;
			canvas.drawPiano();
		}, true);
		_public.addEventListener("keydown", function(event, key){
			key = event.which.toString();
			if(canvas.pianoPower.on && _private.Piano.Key.map.hasOwnProperty(key)) {
				key = _private.Piano.Key.map[key];
				canvas.pianoKeys[key].press();
				canvas.drawPiano();
			}
		}, true);
		_public.addEventListener("keyup", function(event, key){
			key = event.which.toString();
			if(_private.Piano.Key.map.hasOwnProperty(key)) {
				key = _private.Piano.Key.map[key];
				canvas.pianoKeys[key].release();
				canvas.drawPiano();
			}
		}, true);
	};
	
	_private.Piano.drawPiano = function(context) {
	
		context = this.getContext("2d");
		this.pianoBg.draw(context);
		this.pianoTitle.draw(context);
		this.pianoPower.draw(context);
		this.pianoKeys.draw(context);
		
	};
	
	_private.Piano.getAudioExtension = function(audio, mime) {
		if(!!audio.canPlayType) {
			mime = audio.canPlayType("audio/mpeg");
			if(mime.length > 0 && mime != "no") { return ".mp3"; }
			mime = audio.canPlayType("audio/x-wav");
			if(mime.length > 0 && mime != "no") { return ".wav"; }
			mime = audio.canPlayType("audio/wav");
			if(mime.length > 0 && mime != "no") { return ".wav"; }
		} 
		return null;
	};
	
	_private.Piano.Title = function(options) {
		this.top = options.height / 5;
		this.left = options.width / 12;
		this.color = options.titleColor;
		this.font = (options.height / 8) + "px " + options.titleFont;
	};
	
	_private.Piano.Title.prototype = {
		draw: function(context) {
			if (!!context.fillText) {
				context.fillStyle = this.color;
				context.font = this.font;
				context.fillText("HTML5 PIANO", this.left, this.top);
			}
		}
	};
	
	_private.Piano.Power = function(options) {
		this.width = options.width / 20;
		this.height = options.height / 20;
		this.on = false;
		this.onFill = options.powerOnFill;
		this.onStroke = options.powerOnStroke;
		this.offFill = options.powerOffFill;
		this.offStroke = options.powerOffStroke;
		this.top = 1;
		this.left = options.width - this.width - 1;
		
	};
	
	_private.Piano.Power.prototype = {
		draw: function(context) {
			context.fillStyle = this.on ? this.onFill : this.offFill;
			context.strokeStyle = this.on ? this.onStroke : this.offStroke;
			context.fillRect(this.left, this.top, this.width, this.height);
			context.strokeRect(this.left, this.top, this.width, this.height);
		}
	};
	
	_private.Piano.Background = function(options) {
		this.width = options.width;
		this.height = options.height;
		this.fill = options.backgroundFill;
		this.stroke = options.backgroundStroke;
	};
	
	_private.Piano.Background.prototype = {
		draw: function(context) {
			context.fillStyle = this.fill;
			context.strokeStyle = this.stroke;
			context.fillRect(0, 0, this.width, this.height);
			context.strokeRect(0, 0, this.width, this.height);
		}
	};
	
	_private.Piano.Key = function(x, y, w, h, fill, stroke, afill, astroke) {
		this.x				= x;
		this.y				= y;
		this.width			= w;
		this.height			= h;
		this.pressed		= false;
		this.fill			= fill;
		this.stroke			= stroke;
		this.activeFill		= afill;
		this.activeStroke	= astroke;
	};
	
	_private.Piano.Key.map = {
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
	};
	
	_private.Piano.Key.notes = ["gs","a","bb","b","c","cs","d","eb","e","f","fs","g"];
	
	_private.Piano.Key.audioFolder = "instruments";
	
	_private.Piano.Key.loadKeys = function(options, callback, keyData, keys, key, path, i) {
		keys = { 
			blackKeys: [], 
			whiteKeys: [], 
			draw: function(context, i) {
				for(i=0;i<this.whiteKeys.length;i++) {
					this.whiteKeys[i].draw(context);
				}
				for(i=0;i<this.blackKeys.length;i++) {
					this.blackKeys[i].draw(context);
				}
			}
		};
		path = _private.Piano.Key.audioFolder + "/" + options.voice + "/";
		keyData = {
			callback: callback,
			queue: 0,
			last: null,
			top: (3 * options.height / 10),
			white: { width: options.width/8, height: options.height/1.8 }, 
			black: { width: options.width/16, height: options.height/3 }
		};
		
		keyData.white.dx = keyData.white.width/2;
		keyData.black.dx = keyData.white.dx - (keyData.black.width / 2);
		
		for (i=0; i<_private.Piano.Key.notes.length; i++) {
			key = _private.Piano.Key.notes[i];
			if (key.length === 1) {
				keys[key] = keys.whiteKeys[keys.whiteKeys.length] = new _private.Piano.Key(
					keyData.white.dx, 
					keyData.top, 
					keyData.white.width, 
					keyData.white.height,
					options.whiteKeyFill,
					options.whiteKeyStroke,
					options.activeKeyFill,
					options.activeKeyStroke);
				keyData.white.dx += keyData.white.width; 
				if(keyData.last === "w") { keyData.black.dx += keyData.white.width; }
				keyData.last = "w";
			} else {
				keys[key] = keys.blackKeys[keys.blackKeys.length] = new _private.Piano.Key(
					keyData.black.dx, 
					keyData.top, 
					keyData.black.width, 
					keyData.black.height,
					options.blackKeyFill,
					options.blackKeyStroke,
					options.activeKeyFill,
					options.activeKeyStroke);
				keyData.black.dx += keyData.white.width;
				keyData.last = "b";
			}
			keyData.queue++;
			keys[key].bindAudio(
				path + key + options.extension,
				_private.Piano.Key.onKeyLoaded(keyData)
			);
		}
		
		return keys;
	};
	
	_private.Piano.Key.onKeyLoaded = function(data) {
		return function() {
			if(--data.queue === 0) { data.callback(); }
		};
	};
	
	_private.Piano.Key.prototype = {
		draw: function(context) {
			context.fillStyle = this.pressed ? this.activeFill : this.fill;
			context.strokeStyle = this.pressed ? this.activeStroke : this.stroke;
			context.fillRect(this.x, this.y, this.width, this.height);
			context.strokeRect(this.x, this.y, this.width, this.height);
		},
		bindAudio: function(source, callback, key, version) {
			key				= this;
			key.audio		= new Audio("");
			key.audio.src	= source;
			key.audio.addEventListener("canplaythrough", function onCanPlayThrough() {
				key.audio.removeEventListener("canplaythrough", onCanPlayThrough, true);
				callback(key.audio);
			}, true);
			key.audio.load();
		},
		press: function() {
			if(!this.pressed) {	
				this.audio.stop();			
				this.audio.play();
				this.pressed = true;
			}
		},
		release: function() {
			this.pressed = false;
		},
		isMouseHit: function(x, y) {
			return (x >= this.x) && (y >= this.y) && (x <= this.x + this.width) && (y <= this.y + this.height);
		}
	};
	
})(window, {});