
export class DataRecorder extends HTMLElement {
	constructor() {
		super();
		this.selectedMateIndex = -1;
		this.selectedMateTimeMs = -1;

		this.videoId = "";
		// names
		this.squadmates = [];
		// { key, name }, eg. { "g", "goal" }
		this.dataEvents = [];
		// args: dataRecorder
		this.configChangedCallbacks = [];
		this.configBox = document.getElementsByClassName("title-section__config")[0];

		this.databox = document.getElementsByClassName("databox__textarea")[0];
		this.showOverlayCheckbox = document.getElementById("show-overlay-checkbox");

		this.#init();
	}

	subscribeConfigChanged(callback) {
		this.configChangedCallbacks.push(callback);
	}

	#init() {
		addEventListener("keydown", this.#onKeyDown.bind(this));
		this.#initConfigBox();
		this.showOverlayCheckbox.onchange = this.#optionsChanged.bind(this);
	}

	#initConfigBox() {
		// Write url video ID to config.
		let params = new URLSearchParams(location.search);
		let urlVideoId = params.get("v");
		if (urlVideoId != null && urlVideoId.length > 0) {
			let lines = this.configBox.value.split("\n");
			lines[0] = `https://www.youtube.com/watch?v=${urlVideoId}`;
			this.configBox.value = lines.join("\n");
		}
		
		// Autosize config box.
		this.configBox.oninput = (e) => {
			this.configBox.style.height = 0;
			let computedStyle = getComputedStyle(this.configBox);
			let padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
			this.configBox.style.height = (this.configBox.scrollHeight - padding) + "px";
		};
		if (this.configBox.value.length > 0) {
			// Initially auto-size to cached text.
			this.configBox.oninput();
		}

		// Allow typing tab in config box.
		this.configBox.addEventListener("keydown", function(e) {
			if (e.key == "Tab") {
				e.preventDefault();
				let start = this.selectionStart;
				let end = this.selectionEnd;

				// Set textarea value to: text before caret + tab + text after caret.
				this.value = this.value.substring(0, start) +
					"\t" + this.value.substring(end);

				// Put caret at right position again.
				this.selectionStart =
				this.selectionEnd = start + 1;
			}
		});

		// Handle config changes.
		this.configBox.onchange = this.#parseConfigBox.bind(this);

		this.#parseConfigBox();
	}

	#optionsChanged() {
		// View.
		this.#updateViewSquadSelection();
		this.#updateViewSquadList();
		this.#updateViewDataBox();
	}

	#parseConfigBox() {
		// Video Url.
		const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;	
		let m = videoIdRegex.exec(this.configBox.value);
		if (m && m.length > 1) {
			this.videoId = m[1];
		}	
		
		// Squad list.
		this.squadmates = []
		const squadRegex = /^Squad\n([^\S\r\n].*\n*)*/gm;
		m = squadRegex.exec(this.configBox.value);
		let lines = m && m.length > 0 ? m[0].split("\n") : [];
		for (let i = 1; i < lines.length; ++i) {
			let line = lines[i].trim();
			if (line.length > 0) {
				this.squadmates.push(lines[i].trim());
			}
		}
		this.selectedMateIndex = -1;

		// Data events.
		this.dataEvents = {};
		const eventsRegex = /^Events\n((\t|\s).*\n*)*/gm;
		m = eventsRegex.exec(this.configBox.value);
		lines = m && m.length > 0 ? m[0].split("\n") : [];
		for (let i = 1; i < lines.length; ++i) {
			let values = lines[i].split(",");
			let key = values.length > 0 ? values[0].trim() : "";
			if (key.length > 0) {
				this.dataEvents[key] = values.length > 1 ? values[1].trim() : "";	
			}
		}

		// Callbacks.
		this.configChangedCallbacks.forEach(callback => callback(this));

		// View.
		this.#updateViewSquadSelection();
		this.#updateViewSquadList();
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

	#onKeyDown(e) {
		// Ignore hotkey while typing in the config or data boxes.
		if (document.activeElement.tagName == "TEXTAREA") {
			return
		}

		// Select squadmate.
		let numKey = parseInt(e.key);
		if (!isNaN(numKey)) {
			let timeSinceSelectMateMs = Date.now() - this.selectedMateTimeMs;
			if (timeSinceSelectMateMs < 500) {
				let mateNum = parseInt((this.selectedMateIndex + 1).toString() + numKey);
				let mateIndex = mateNum - 1;
				this.#selectMate(mateIndex);
			} else {
				let mateIndex = numKey - 1;
				this.#selectMate(mateIndex);
			}
		
		// Delete last data line.
		} else if (e.key == "Delete") {
			this.databox.value = this.databox.value.replace(/\r?\n?[^\r\n]*$/, "");	
			
		// Ignore alpha keys reserved for other hotkeys.
		} else if (/^j|k|l|q|w|e|r|t$/.test(e.key)) {

		// Record event.
		} else if (/^[a-zA-Z]$/.test(e.key) && e.key in this.dataEvents) {
			let ytPlayer = document.getElementsByTagName("video-controller")[0].ytPlayer;

			let time = ytPlayer ? this.#secondsToHHMMSS(ytPlayer.getCurrentTime()) : 0;
			let eventName = this.dataEvents[e.key] || "";
			let mateName = this.#getMateName(this.selectedMateIndex);

			if (this.databox.value.length > 0) {
				this.databox.value += "\n";
			}
			this.databox.value += `${time}` + (eventName ? `, ${eventName}` : "") + (mateName ? `, ${mateName}` : "");
			this.databox.scrollTop = this.databox.scrollHeight;
		}
	}

	#updateViewSquadSelection() {
		let selectedMates = document.getElementsByClassName("squad__item--selected");
		for (let i = 0; i < selectedMates.length; ++i) {
			selectedMates[i].classList.remove("squad__item--selected");
		}
		let squadList = document.getElementsByClassName("squad__list")[0];
		if (this.selectedMateIndex >= 0 && this.selectedMateIndex < squadList.children.length) {
			squadList.children[this.selectedMateIndex].classList.add("squad__item--selected");
		}
	}

	#updateViewSquadList() {
		let squadList = document.getElementsByClassName("squad__list")[0];
		squadList.replaceChildren();
		for (let name of this.squadmates) {
			let item = document.createElement("li");
			item.classList.add("squad__item");
			item.textContent = name;
			squadList.appendChild(item);
		}

		let squad = document.getElementsByClassName("squad")[0];
		let showOverlay = this.showOverlayCheckbox.checked
		squad.classList.toggle("squad--hidden", this.squadmates.length == 0 || !showOverlay);
	}

	#updateViewDataBox() {
		let showOverlay = this.showOverlayCheckbox.checked
		let databox = document.getElementsByClassName("databox")[0];
		databox.classList.toggle("squad--hidden", !showOverlay);
	}
}

export const registerDataRecorder = () => customElements.define("data-recorder", DataRecorder);