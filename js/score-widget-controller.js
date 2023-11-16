import Util from "./util.js"

class ScoreWidgetController {
	constructor(dataRecorder, gameClock) {
		this.dataRecorder = dataRecorder;
		this.gameClock = gameClock;

		this.leftBox = null;
		this.rightBox = null;
		this.leftNameText = null;
		this.rightNameText = null;
		this.leftScoreText = null;
		this.rightScoreText = null;
		this.clockText = document.getElementsByClassName("score-widget__clock")[0];
	}
	
	update(videoTime) {
		this.clockText.innerHTML = Util.secondsToMMSS(this.gameClock.getTime(videoTime));
	}
}

export default ScoreWidgetController;