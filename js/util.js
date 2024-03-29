
class Util {
	static lerp(a, b, t) {
		t = Util.clamp(t, 0.0, 1.0);
		return (1 - t) * a + t * b;
	}

	static clamp(value, min, max) {
		return Math.min(Math.max(min, value), max);
	}
		
	static map(inputMin, inputMax, outputMin, outputMax, value) {
		if (inputMin > inputMax) {
			return Util.map(inputMax, inputMin, outputMax, outputMin, value);
		}
		if (value < inputMin) {
			return outputMin;
		}
		else if (value > inputMax) {
			return outputMax;
		}
		else {
			return (value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin;
		}
	}

	static modulo(value, n) {
		return ((value % n) + n) % n;
	}

	static secondsToTimestamp(seconds) {
		return new Date(seconds * 1000).toISOString().slice(11, 19);
	}

	static secondsToMMSS(seconds) {
		if (typeof seconds !== 'number' || seconds < 0) {
			return 'Invalid input';
		}

		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);

		const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
		const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

		return `${formattedMinutes}:${formattedSeconds}`;
	}

	static timestampToSeconds(text) {
		var timeRegex = /(\d{2}):(\d{2}):(\d{2})/;
		let match = timeRegex.exec(text);

		if (match) {
			var hours = parseInt(match[1], 10);
			var minutes = parseInt(match[2], 10);
			var seconds = parseInt(match[3], 10);

			var totalTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
			return totalTimeInSeconds;
		} else {
			return null;
		}
	}
	
	// https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
	static colorNameToHex(colour) {
		var colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
			"beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
			"cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
			"darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgrey":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
			"darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategrey":"#2f4f4f","darkturquoise":"#00ced1",
			"darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgrey":"#696969","dodgerblue":"#1e90ff",
			"firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
			"gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","grey":"#808080","green":"#008000","greenyellow":"#adff2f",
			"honeydew":"#f0fff0","hotpink":"#ff69b4",
			"indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
			"lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
			"lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategrey":"#778899","lightsteelblue":"#b0c4de",
			"lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
			"magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
			"mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
			"navajowhite":"#ffdead","navy":"#000080",
			"oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
			"palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
			"rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
			"saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategrey":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
			"tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
			"violet":"#ee82ee",
			"wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
			"yellow":"#ffff00","yellowgreen":"#9acd32"};

		if (typeof colours[colour.toLowerCase()] != "undefined") {
			return colours[colour.toLowerCase()];
		}
		return null;
	}
	
	/**
	* Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
	* 
	* @param {String} text The text to be rendered.
	* @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
	* 
	* @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
	*/
	static getTextWidth(text, font) {
		// re-use canvas object for better performance
		const canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"));
		const context = canvas.getContext("2d");
		context.font = font;
		const metrics = context.measureText(text);
		return metrics.width;
	}

	static getCssStyle(element, prop) {
		return window.getComputedStyle(element, null).getPropertyValue(prop);
	}

	static getCanvasFont(el = document.body) {
		const fontWeight = this.getCssStyle(el, 'font-weight') || 'normal';
		const fontSize = this.getCssStyle(el, 'font-size') || '16px';
		const fontFamily = this.getCssStyle(el, 'font-family') || 'Times New Roman';
		return `${fontWeight} ${fontSize} ${fontFamily}`;
	}
}

export default Util;