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
 */

/*jslint onevar: true, strict: true, browser: true */
/*global window, Audio */
"use strict";
(function(_public, _private){
	
	/**
	 * This is the public class for accessing the piano element
	 * @version 1.0.0
	 * @requires Audio, HtmlCanvasElement
	 */
	_public.Piano = {
		
		/**
		 * A collection of piano voices, intended for use with the factory Piano.createInstance
		 */
		Voices: {
			
			/**
			 * Represents a grand piano
			 */
			GRAND_PIANO: "grandPiano"
		},
		
		/**
		 * The primary factory for creating instances of the Piano class
		 * @param {String} instrument A string representing the voice to use for the current Piano instance. The selected 	 	  
		 *                            value should be one of the voices provided in Piano.Voices
		 */
		createInstance: function(instrument, extension) {
			extension = _private.Piano.getAudioExtension();
			return extension ? _private.Piano(instrument, extension) : null;
		}
		
	};
	
	_private.Piano = function(instrument, extension, canvas) {
		canvas 				= document.createElement("canvas");
		canvas.style.width	= canvas.style.height = "100px";
		canvas.width 		= canvas.height = 100;
		canvas.mouseTarget	= null;
		canvas.pianoBg		= new _private.Piano.Background();
		canvas.pianoPower	= new _private.Piano.Power();
		canvas.pianoTitle	= new _private.Piano.Title();
		canvas.drawPiano	= _private.Piano.drawPiano;
		canvas.pianoKeys	= _private.Piano.Key.getKeys(instrument, extension, _private.Piano.onKeysLoaded(canvas));
		_private.Piano.attachListeners(canvas);
		return canvas;
	};
	
	_private.Piano.attachListeners = function(canvas) {
		canvas.addEventListener("mousedown", function(event, point){
			point = { x: event.clientX-7, y: event.clientY-7 };
			if (canvas.mouseTarget) {
				canvas.mouseTarget.release();
				canvas.mouseTarget = null;
			}
			for (var key in canvas.pianoKeys) {
				if(canvas.pianoKeys.hasOwnProperty(key) && canvas.pianoKeys[key].isMouseHit(point.x, point.y)) {
					console.log(canvas.pianoKeys[key]);
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
	
	_private.Piano.drawPiano = function(context, blacks, key) {
	
		context = this.getContext("2d");
		
		this.pianoBg.draw(context);
		
		this.pianoTitle.draw(context);
		
		this.pianoPower.draw(context);
		
		blacks = [];
		
		for (key in this.pianoKeys) {
			if(this.pianoKeys.hasOwnProperty(key)) {
				if(key.length == 1) {
					this.pianoKeys[key].draw(context);
				} else {
					blacks.push(this.pianoKeys[key]);
				}
			}
		}
		
		for (key = 0; key<blacks.length; key++) {
			blacks[key].draw(context);
		}
		
	};
	
	_private.Piano.onKeysLoaded = function(instance) {
		return function() {
			instance.drawPiano();
		};
	};
	
	_private.Piano.getAudioExtension = function(test, mime) {
		if (typeof Audio !== undefined) {
			test = new Audio();
			mime = test.canPlayType("audio/x-wav");
			if(mime.length > 0 && mime != "no") { return ".wav"; }
			mime = test.canPlayType("audio/wav");
			if(mime.length > 0 && mime != "no") { return ".wav"; }
			mime = test.canPlayType("audio/ogg");
			if(mime.length > 0 && mime != "no") { return ".ogg"; }
		}
		return null;
	};
	
	_private.Piano.Title = function() {
		this.top = 20;
		this.left = 6;
	};
	
	_private.Piano.Title.prototype = {
		draw: function(context) {
			context.fillStyle = "#FFF";
			context.font = "13px 'Times New Roman', Times";
			context.fillText("HTML5 PIANO", this.left, this.top);
		}
	};
	
	_private.Piano.Power = function() {
		this.on = false;
		this.top = 1;
		this.left = 94;
		this.width = this.height = 5;
	};
	
	_private.Piano.Power.prototype = {
		draw: function(context) {
			context.fillStyle = this.on ? "#0F0" : "#F00";
			context.strokeStyle = "#000";
			context.fillRect(this.left, this.top, this.width, this.height);
			context.strokeRect(this.left, this.top, this.width, this.height);
		}
	};
	
	_private.Piano.Background = function() {
		this.width = this.height = 100;
	};
	
	_private.Piano.Background.prototype = {
		draw: function(context) {
			context.fillStyle = "#8A4B08";
			context.strokeStyle = "#000";
			context.fillRect(0, 0, this.width, this.height);
			context.strokeRect(0, 0, this.width, this.height);
		}
	};
	
	_private.Piano.Key = function(x, y, w, h, fill) {
		this.x			= x;
		this.y 			= y;
		this.width 		= w;
		this.height		= h;
		this.pressed 	= false;
		this.fill 		= fill;
		this.stroke 	= "#000";
		this.activeFill = "#CCC";
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
	
	_private.Piano.Key.audioFolder = "instruments";
	
	_private.Piano.Key.getKeys = function(instrument, extension, callback, keyData, keys, key) {
		keys = {};
		instrument = _private.Piano.Key.audioFolder + "/" + instrument + "/";
		keyData = {
			callback: callback, 
			queue: 0,
			last: null,
			top: 30,
			white: { dx: 8, width: 12, height: 60 }, 
			black: { dx: 5, width: 6, height: 33 }
		};
		for (var i in _private.Piano.Key.map) {
			if(_private.Piano.Key.map.hasOwnProperty(i)) {
				key = _private.Piano.Key.map[i];
				if (key.length === 1) {
					keys[key] = new _private.Piano.Key(
						keyData.white.dx, 
						keyData.top, 
						keyData.white.width, 
						keyData.white.height,
						"#FFF");
					keyData.white.dx += keyData.white.width; 
					if(keyData.last === "w") { keyData.black.dx += keyData.white.width; }
					keyData.last = "w";
				} else {
					keys[key] = new _private.Piano.Key(
						keyData.black.dx, 
						keyData.top, 
						keyData.black.width, 
						keyData.black.height,
						"#000");
					keyData.black.dx += keyData.white.width;
					keyData.last = "b";
				}
				keyData.queue++;
				keys[key].bindAudio(
					instrument + key + extension,
					_private.Piano.Key.onKeyLoaded(keyData)
				);
			}
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
			context.strokeStyle = this.stroke;
			context.fillRect(this.x, this.y, this.width, this.height);
			context.strokeRect(this.x, this.y, this.width, this.height);
		},
		bindAudio: function(source, callback, key) {
			key				= this;
			key.audio 		= new Audio();
			key.audio.src 	= source;
			key.audio.addEventListener("canplaythrough", function onCanPlayThrough() {
				key.audio.removeEventListener("canplaythrough", onCanPlayThrough, true);
				callback(key.audio);
			}, true);
			key.audio.load();
		},
		press: function() {
			if(!this.pressed) {
				this.audio.pause();
				this.audio.load();				
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
