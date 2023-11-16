
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
}

export default Util;