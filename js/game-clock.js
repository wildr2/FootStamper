import Util from "./util.js"

class GameClock {
	constructor() {
		// [[video seconds, clock seconds], ...] ordered by video seconds
		this.clockSyncPairs = [];
	}

	onConfigChanged(dataRecorder) {
		// Clock
		// 		00:00:00, 00:00:00
		// 		00:45:00, 00:45:00
		let configText = dataRecorder.getConfigText();
		this.clockSyncPairs = [];
		const clockRegex = /^Clock\n((\t|\s).*\n*)*/gm;
		let m = clockRegex.exec(configText);
		let lines = m && m.length > 0 ? m[0].split("\n") : [];
		for (let i = 1; i < lines.length; ++i) {
			let values = lines[i].split(",");
			let videoTimestampStr = values.length > 0 ? values[0].trim() : "";
			let clockTimestampStr = values.length > 1 ? values[1].trim() : "";
			let videoSeconds = Util.timestampToSeconds(videoTimestampStr);
			let clockSeconds = Util.timestampToSeconds(clockTimestampStr);
			if (videoSeconds != null && clockSeconds != null) {
				this.clockSyncPairs.push([videoSeconds, clockSeconds])
			}
		}
		this.clockSyncPairs.sort(function(a, b) {
			return a[0] - b[0];
		});
	}
	
	getTime(videoTime) {
		return videoTime + this.getClockOffset(videoTime);
	}

	getClockOffset(videoTime) {
		let pairs = this.clockSyncPairs;
		for (let i = 0; i < pairs.length; ++i) {
			let beforeNextPair = i == pairs.length - 1 || videoTime < pairs[i + 1][0]
			if (beforeNextPair && videoTime >= pairs[i][0]) {
				return pairs[i][1] - pairs[i][0]
			}
		}
		return 0;
	}
}

export default GameClock;