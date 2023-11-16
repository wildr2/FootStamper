import Util from "./util.js"

class ScoreWidgetController {
	constructor(dataRecorder, gameClock) {
		this.dataRecorder = dataRecorder;
		this.gameClock = gameClock;

		this.leftBox = document.querySelector(".score-widget__box--left");
		this.rightBox = document.querySelector(".score-widget__box--right");
		this.leftNameText = this.leftBox.querySelector(".score-widget__name");
		this.rightNameText = this.rightBox.querySelector(".score-widget__name");
		this.leftScoreText = this.leftBox.querySelector(".score-widget__number");
		this.rightScoreText = this.rightBox.querySelector(".score-widget__number");
		this.clockText = document.querySelector(".score-widget__clock");
	}

	onConfigChanged(dataRecorder) {
		// Sides
		// 		SR, #white, #black
		// 		PC, #purple, #white

		let configText = dataRecorder.getConfigText();
		const sidesRegex = /^Sides\n((\t|\s).*\n*)*/gm;
		let m = sidesRegex.exec(configText);
		let lines = m && m.length > 0 ? m[0].split("\n") : [];
		for (let i = 1; i < Math.min(lines.length, 3); ++i) {
			let values = lines[i].split(",");
			let name = values.length > 0 ? values[0].trim() : "";
			let color1 = values.length > 1 ? values[1].trim() : "";
			let color2 = values.length > 2 ? values[2].trim() : "";
			color1 = color1[0] == "#" ? color1 : Util.colorNameToHex(color1);
			color2 = color2[0] == "#" ? color2 : Util.colorNameToHex(color2);
			if (i == 1) {
				this.setupLeftSide(name, color1, color2);
			} else {
				this.setupRightSide(name, color1, color2);
			}
		}
	}

	setupLeftSide(name, color1, color2) {
		this.leftNameText.innerHTML = name;
		this.leftBox.style.backgroundColor = color1;
		this.leftNameText.style.color = color2;
	}

	setupRightSide(name, color1, color2) {
		this.rightNameText.innerHTML = name;
		this.rightBox.style.backgroundColor = color1;
		this.rightNameText.style.color = color2;
	}
	
	update(videoTime) {
		this.clockText.innerHTML = Util.secondsToMMSS(this.gameClock.getTime(videoTime));

		// TODO: score.
	}
}

export default ScoreWidgetController;