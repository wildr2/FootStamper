
class GameClock {
	constructor(dataRecorder) {
		this.dataRecorder = dataRecorder;
	}
	
	getTime(videoTime) {
		return videoTime + this.getClockOffset(videoTime);
	}

	getClockOffset(videoTime) {
		let pairs = this.dataRecorder.clockSyncPairs;
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