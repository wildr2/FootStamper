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
}

export default Util;