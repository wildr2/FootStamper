import { defaultYtVideoId, configTemplate1, configTemplate2 } from "./common.js"
import Util from "./util.js"

export class DataRecorder extends HTMLElement {
	constructor() {
		super();
		this.selectedMateIndex = -1;
		this.selectedMateTimeMs = -1;
		// names
		this.squadmates = [];
		// { key, name }, eg. { "g", "goal" }
		this.dataEvents = [];
		this.configBox = document.getElementsByClassName("title-section__config")[0];
		this.config1Button = document.getElementsByClassName("title-section__config-button-1")[0];
		this.config2Button = document.getElementsByClassName("title-section__config-button-2")[0];
		this.browseVideoInput = document.getElementsByClassName("title-section__browse-video-input")[0]
		this.dataBox = document.getElementsByClassName("databox__textarea")[0];
		this.showDataOverlayCheckbox = document.getElementById("show-data-data-overlay-checkbox");
		this.videoController = document.getElementsByTagName("video-controller")[0];
		// args: dataRecorder
		this.configChangedCallbacks = [];
		// args: dataRecorder
		this.dataChangedCallbacks = [];

		this.#init();
	}

	subscribeConfigChanged(callback) {
		this.configChangedCallbacks.push(callback);
	}

	subscribeDataChanged(callback) {
		this.dataChangedCallbacks.push(callback);
	}

	subscribeBrowseVideoInputChanged(callback) {
		this.browseVideoInputChangedCallbacks.push(callback);
	}

	getConfigText() {
		return this.configBox.value;
	}

	getDataText() {
		return this.dataBox.value;
	}

	getYtVideoId() {
		return this.#parseYtVideoId(this.configBox.value);
	}

	getCustomVideoFile() {
		return this.browseVideoInput.files.length > 0 ? this.browseVideoInput.files[0] : null
	}

	getEventTimestamps() {
		let data = this.dataBox.value;
		let lines = data.split("\n");
		let timestamps = [];
		for (let line of lines) {
			let timestamp = Util.timestampToSeconds(line);
			if (timestamp) {
				timestamps.push(timestamp);
			}
		}
		return timestamps;
	}

	#init() {
		addEventListener("keydown", this.#onKeyDown.bind(this));
		this.#initConfigBox();

		this.config1Button.onclick = () => this.#applyConfigTemplate(1);
		this.config2Button.onclick = () => this.#applyConfigTemplate(2);
		this.showDataOverlayCheckbox.onchange = this.#onOptionsChanged.bind(this);
		this.#initBrowseVideoInput();
		
		// Handle manual data changes.
		this.dataBox.onchange = this.#onDataChanged.bind(this);

		// Handle initial options.
		this.#onOptionsChanged();
	}

	#initConfigBox() {
		// Write url video ID to config.
		let params = new URLSearchParams(location.search);
		let urlYtVideoId = params.get("v");
		if (urlYtVideoId != null && urlYtVideoId.length > 0) {
			let lines = this.configBox.value.split("\n");
			lines[0] = `https://www.youtube.com/watch?v=${urlYtVideoId}`;
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

	#initBrowseVideoInput() {
		var onChanged = function (event) {
			this.configBox.value = this.#removeVideoUrlFromText(this.configBox.value);
			this.configBox.oninput();
			this.configBox.onchange();
		}
		this.browseVideoInput.addEventListener('change', onChanged.bind(this), false);
	}

	#onOptionsChanged() {
		// View.
		this.#updateViewSquadSelection();
		this.#updateViewSquadList();
		this.#updateViewDataBox();
	}

	#onDataChanged() {
		// Sort data.
		let lines = this.dataBox.value.split("\n");
		lines.sort();
		this.dataBox.value = lines.join("\n");
		
		// Callbacks.
		this.dataChangedCallbacks.forEach(callback => callback(this));
	}

	#applyConfigTemplate(number) {
		if (number < 1 || number > 2) {
			return;
		}
		let template = number == 1 ? configTemplate1 : configTemplate2;
		
		// Set template without changing video.
		// (Unless the config is unchanged from a template, in that case take the video of the new template).
		if (this.videoController.usingYtPlayer()) {
			let isConfigUnchanged = this.configBox.value == configTemplate1 || this.configBox.value == configTemplate2
			let ytVideoId = this.#parseYtVideoId(this.configBox.value);

			this.configBox.value = template;

			if (ytVideoId != null && !isConfigUnchanged) {
				// Keep current video.
				let lines = this.configBox.value.split("\n");
				lines[0] = `https://www.youtube.com/watch?v=${ytVideoId}`;
				this.configBox.value = lines.join("\n");
			}
		} else {
			this.configBox.value = this.#removeVideoUrlFromText(template);
		}

		this.configBox.oninput();
		this.configBox.onchange();
	}

	#parseYtVideoId(text) {
		const ytVideoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;	
		let m = ytVideoIdRegex.exec(text);
		if (m && m.length > 1) {
			return m[1];
		}	
		return null
	}

	#removeVideoUrlFromText(text) {
		const regex = /.*(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11}).*\n*/i
		text = text.replace(regex, "");
		return text;
	}

	#parseConfigBox() {
		// Video Url.
		let configYtVideoId = this.#parseYtVideoId(this.configBox.value);

		// Update URL with video id.
		let params = new URLSearchParams(location.search);
		let urlYtVideoId = params.get("v");
		let desiredUrlYtVideoId = configYtVideoId && configYtVideoId != defaultYtVideoId ? configYtVideoId : null;
		if (urlYtVideoId != desiredUrlYtVideoId) {
			var url = new URL(window.location.href);
			var searchParams = url.searchParams;
			if (desiredUrlYtVideoId) {
				searchParams.set("v", desiredUrlYtVideoId);
			} else {
				searchParams.delete("v");
			}
			window.history.replaceState(null, null, url.href);
		}

		// Update browse video input.
		if (configYtVideoId) {
			this.browseVideoInput.value = null;
		}
		
		// Squad list.
		this.squadmates = [];
		const squadRegex = /^Squad\n([^\S\r\n].*\n*)*/gm;
		let m = squadRegex.exec(this.configBox.value);
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

	#deleteMostRecentTimestamp(time) {
		let data = this.dataBox.value;
		let lines = data.split("\n");
		
		for (let i = lines.length - 1; i >= 0; --i) {
			let timestamp = Util.timestampToSeconds(lines[i]);
			if (timestamp && timestamp <= time)	{
				lines.splice(i, 1);
				break;
			}
		}

		this.dataBox.value = lines.join("\n");
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
		
		// Delete most recent timestamp.
		} else if (e.key == "Delete") {
			let videoTime = this.videoController.getCurrentTime();
			this.#deleteMostRecentTimestamp(videoTime);
			
		// Ignore alpha keys reserved for other hotkeys.
		} else if (/^j|k|l|q|w|e|r|t|f$/.test(e.key)) {

		// Record event.
		} else if (/^[a-zA-Z]$/.test(e.key) && e.key in this.dataEvents) {
			let videoTime = this.videoController.getCurrentTime();
			let time = Util.secondsToTimestamp(videoTime);
			let eventName = this.dataEvents[e.key] || "";
			let mateName = this.#getMateName(this.selectedMateIndex);
			this.#recordMatchEvent(time, eventName, mateName);
		} else if (e.key == "[") {
			let videoTime = this.videoController.getCurrentTime();
			let time = Util.secondsToTimestamp(videoTime);
			let eventName = "#+1<"
			this.#recordMatchEvent(time, eventName, null);
		} else if (e.key == "]") {
			let videoTime = this.videoController.getCurrentTime();
			let time = Util.secondsToTimestamp(videoTime);
			let eventName = "#+1>"
			this.#recordMatchEvent(time, eventName, null);
		}
	}

	#recordMatchEvent(time, eventName, mateName) {
		if (this.dataBox.value.length > 0) {
			this.dataBox.value += "\n";
		}
		this.dataBox.value += `${time}` + (eventName ? `, ${eventName}` : "") + (mateName ? `, ${mateName}` : "");
		this.dataBox.scrollTop = this.dataBox.scrollHeight;
		
		this.#onDataChanged();
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
		let showOverlay = this.showDataOverlayCheckbox.checked
		squad.classList.toggle("hidden", this.squadmates.length == 0 || !showOverlay);
	}

	#updateViewDataBox() {
		let showOverlay = this.showDataOverlayCheckbox.checked
		let dataBox = document.getElementsByClassName("databox")[0];
		dataBox.classList.toggle("hidden", !showOverlay);
	}
}

export const registerDataRecorder = () => customElements.define("data-recorder", DataRecorder);