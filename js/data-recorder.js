
export class DataRecorder extends HTMLElement {
	constructor() {
		super();
		this.selectedMateIndex = -1;
		this.selectedMateTimeMs = -1;
		this.squadmates = [];
		this.videoId = "";
		this.configBox = document.getElementsByClassName("title-section__config")[0];
		// args: dataRecorder
		this.configChangedCallbacks = [];
		this.#init();
	}

	subscribeConfigChanged(callback) {
		this.configChangedCallbacks.push(callback);
	}

	#init() {
		addEventListener("keypress", this.#onKeyPress.bind(this));
		this.#initConfigBox();
	}

	#initConfigBox() {
		// Set initial height -- avoid issues with delay autosizing initially.
		this.configBox.style.height = "410px";

		// Autosize config box.
		this.configBox.oninput = (e) => {
			this.configBox.style.height = "";
			this.configBox.style.height = this.configBox.scrollHeight + "px";
		};

		// Allow typing tab in config box.
		this.configBox.addEventListener("keydown", function(e) {
			if (e.key == "Tab") {
				e.preventDefault();
				let start = this.selectionStart;
				let end = this.selectionEnd;

				// set textarea value to: text before caret + tab + text after caret
				this.value = this.value.substring(0, start) +
					"\t" + this.value.substring(end);

				// put caret at right position again
				this.selectionStart =
				this.selectionEnd = start + 1;
			}
		});

		// Set default config.
		fetch('config.txt')
			.then(response => response.text())
			.then(text => {
				this.configBox.value = text;
				this.#parseConfigBox();
			});

		// Handle config changes.
		this.configBox.onchange = this.#parseConfigBox.bind(this);
	}

	#parseConfigBox() {
		// Video Url.
		const video_id_regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;	
		let m = video_id_regex.exec(this.configBox.value);
		if (m.length > 1) {
			this.videoId = m[1];
		}	
		
		// Squad list.
		this.squadmates = []
		const squad_regex = /^Squad\n((\t|\s).*\n*)*/gm;
		m = squad_regex.exec(this.configBox.value);
		let lines = m.length > 0 ? m[0].split("\n") : [];
		for (let i = 1; i < lines.length; ++i) {
			if (lines[i].length > 0) {
				this.squadmates.push(lines[i].trim());
			}
		}
		this.selectedMateIndex = -1
		this.#updateViewSquadSelection();
		this.#updateViewSquadList();

		// Match events.

		// Callbacks.
		this.configChangedCallbacks.forEach(callback => callback(this));
	}

	#getMateName(index) {
		if (index >= 0 && index < this.squadmates.length) {
			return this.squadmates[index];
		}
		return "";
	}

	#selectMate(index) {
		this.selectedMateIndex = index;
		this.selectedMateTimeMs = Date.now();
		this.#updateViewSquadSelection();
	}

	#secondsToHHMMSS(seconds) {
		return new Date(seconds * 1000).toISOString().slice(11, 19);
	}

	#onKeyPress(e) {
		// Select squadmate.
		let numKey = parseInt(e.key)
		if (!isNaN(numKey)) {
			let timeSinceSelectMateMs = Date.now() - this.selectedMateTimeMs
			if (timeSinceSelectMateMs < 500) {
				let mateNum = parseInt((this.selectedMateIndex + 1).toString() + numKey)
				let mateIndex = mateNum - 1
				this.#selectMate(mateIndex)
			} else {
				let mateIndex = numKey - 1
				this.#selectMate(mateIndex)
			}
			
		// Ignore alpha keys reserved for other hotkeys.
		} else if (/^j|k|l$/.test(e.key)) {

		// Record event.
		} else if (/^[a-zA-Z]$/.test(e.key)) {
			let databox = document.getElementsByClassName("databox__textarea")[0]
			if (databox != document.activeElement) {
				// Ignore hotkey while typing in the data box.
				let ytPlayer = document.getElementsByTagName("video-controller")[0].ytPlayer
				let time = ytPlayer ? this.#secondsToHHMMSS(ytPlayer.getCurrentTime()) : 0
				let mateName = this.#getMateName(this.selectedMateIndex)
				if (mateName) {
					databox.value += `${time}, ${mateName}, ${e.key}\n`
					databox.scrollTop = databox.scrollHeight;
				}
			}
		}
	}

	#updateViewSquadSelection() {
		let selectedMates = document.getElementsByClassName("squad__item--selected");
		for (let i = 0; i < selectedMates.length; ++i) {
			selectedMates[i].classList.remove("squad__item--selected");
		}
		let squadList = document.getElementsByClassName("squad__list")[0]
		if (this.selectedMateIndex >= 0 && this.selectedMateIndex < squadList.children.length) {
			squadList.children[this.selectedMateIndex].classList.add("squad__item--selected");
		}
	}

	#updateViewSquadList() {
		let squadList = document.getElementsByClassName("squad__list")[0]
		squadList.replaceChildren();
		for (let name of this.squadmates) {
			let item = document.createElement("li");
			item.classList.add("squad__item");
			item.textContent = name;
			squadList.appendChild(item);
		}
	}
}

export const registerDataRecorder = () => customElements.define('data-recorder', DataRecorder);