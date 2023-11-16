import Util from "./util.js"

class ScoreWidgetController {
	constructor(gameClock) {
		this.gameClock = gameClock;
		// [[video seconds, delta score, team index], ...] ordered by video seconds
		this.scoreChangeEvents = []

		// this.widget = document.querySelector(".score-widget");
		this.leftBox = document.querySelector(".score-widget__box--left");
		this.rightBox = document.querySelector(".score-widget__box--right");
		this.leftNameText = this.leftBox.querySelector(".score-widget__name");
		this.rightNameText = this.rightBox.querySelector(".score-widget__name");
		this.leftScoreText = this.leftBox.querySelector(".score-widget__number");
		this.rightScoreText = this.rightBox.querySelector(".score-widget__number");
		this.clockText = document.querySelector(".score-widget__clock");
	}

	setVisible(visible) {
		let widget = document.querySelector(".score-widget");
		widget.classList.toggle("hidden", !visible);
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

	onDataChanged(dataRecorder) {
		// Score change events.

		// 00:00:00, #+1>
		// 00:00:00, #-3<

// 		let data = 
// `00:00:00, #+1<
// 00:00:00, #+1<
// 00:01:00, goal
// 00:04:00, #-3<
// test`

		let data = dataRecorder.getDataText();
		const scoreRegex = /^\d{2}:\d{2}:\d{2},\s*#(\+|\-)(\d.*)(<|>)/gm;
		let m;
		this.scoreChangeEvents = [];
		while ((m = scoreRegex.exec(data)) !== null) {
			let videoSeconds = Util.timestampToSeconds(m[0]);
			let negative = m[1] == "-";
			let number = parseInt(m[2], 10);
			let teamIndex = m[3] == "<" ? 0 : 1;
			let deltaScore = negative ? -number : number;
			this.scoreChangeEvents.push([videoSeconds, deltaScore, teamIndex]);
		}
		this.scoreChangeEvents.sort(function(a, b) {
			return a[0] - b[0];
		});
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

		// TODO: Update less frequently? Perf?
		let score = this.#determineScore(videoTime);
		this.leftScoreText.innerHTML = score[0];
		this.rightScoreText.innerHTML = score[1];
	}

	#determineScore(videoTime) {
		let score = [0, 0];
		for (let event of this.scoreChangeEvents) {
			if (videoTime >= event[0]) {
				score[event[2]] += event[1]
			}
		}
		return score;
	}
}

export default ScoreWidgetController;