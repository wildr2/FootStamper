import { defaultVideoId } from "./common.js"

export class VideoController extends HTMLElement {
	constructor() {
		super();

		this.ytPlayer = null;
		this.hasShownFullscreenAlert = false;
		this.allowFocusCheckbox = document.getElementById("allow-focus-checkbox");
		this.dataRecorder = document.getElementsByTagName("data-recorder")[0];

		this.minZoomPos = -2
		this.maxZoomPos = 2
		this.minZoomLevel = 0
		this.maxZoomLevel = 1
		this.minZoomScale = 1
		this.maxZoomScale = 2

		this.zoomLevel = this.minZoomLevel;
		this.zoomPos = 0;
		this.prevZoomLevel = 0;
		this.zoomTargetScale = 1.0;
		this.zoomScale = 1.0;
		this.zoomOriginX = 50.0;
		this.zoomTargetOriginX = 50.0;
		this.prevAnimateTime = 0;
		this.startZoomInTime = 0;

		this.#init();
	}

	#init() {
		// Loads the IFrame Player API code asynchronously.
		var tag = document.createElement("script");
		tag.src = "https://www.youtube.com/iframe_api";
		var firstScriptTag = document.getElementsByTagName("script")[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		// Creates an <iframe> (and YouTube player)
		//		after the API code downloads.
		window.onYouTubeIframeAPIReady = () => {
			
			// Determine videoId.
			let params = new URLSearchParams(location.search);
			let urlVideoId = params.get("v");
			let videoId = urlVideoId != null && urlVideoId.length > 0 ? urlVideoId : defaultVideoId;

			this.ytPlayer = new YT.Player("player", {
				videoId: videoId,
				playerVars: {
					"playsinline": 1
				},
				events: {
					"onReady": onPlayerReady,
					"onStateChange": onPlayerStateChange
				}
			});
			document.ytPlayer = this.ytPlayer;
		};

		// Called by YT API. Function must be defined.
		window.onPlayerReady = (e) => {
			document.ytPlayerDoc = this.ytPlayer.getIframe().contentDocument;
		};

		// Called by YT API. Function must be defined.
		window.onPlayerStateChange = (e) => {
		};

		// Animation.
		requestAnimationFrame(this.#animationStep.bind(this));

		// Handle config changes.
		this.dataRecorder.subscribeConfigChanged(this.#onConfigChanged.bind(this));

		addEventListener("keypress", this.#onKeyPress.bind(this));
		addEventListener("keydown", this.#onKeyDown.bind(this));
		document.addEventListener('fullscreenchange', this.#onFullscreenChanged.bind(this));
	}

	#onFullscreenChanged() {
		if (document.fullscreenElement) {
			if (document.fullscreenElement.tagName == "IFRAME" && !this.hasShownFullscreenAlert) {
				window.alert("YouTube's fullscreen button doesn't play nice with kittiestats! Use the f hotkey to enter fullscreen instead.");
				this.hasShownFullscreenAlert = true;
			}
		}
		else {
			this.hasShownFullscreenAlert = false;
		}
	}

	#onConfigChanged(dataRecorder) {
		if (this.ytPlayer && this.ytPlayer.getVideoData) {
			let oldVideoId = this.ytPlayer.getVideoData()['video_id'];
			let newVideoId = dataRecorder.videoId;
			if (newVideoId != oldVideoId) {
				this.ytPlayer.loadVideoById(newVideoId);
			}
		}	
	}

	#onKeyDown(e) {
		// Ignore hotkey while typing in the config or data boxes.
		if (document.activeElement.tagName == "TEXTAREA") {
			return
		}

		if (e.key == "ArrowLeft") {
			this.#seekToPrevEvent();
		} else if (e.key == "ArrowRight") {
			this.#seekToNextEvent();
		}
	}

	#onKeyPress(e) {
		// Ignore hotkey while typing in the config or data boxes.
		if (document.activeElement.tagName == "TEXTAREA") {
			return
		}

		let player = this.ytPlayer;
		if (e.key == "f") {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
			} else {
				document.exitFullscreen();
			}
		} else if (e.key == "k") {
			if (player.getPlayerState() != 1) {
				player.playVideo();
			} else {
				player.pauseVideo();
			}
		} else if (e.key == "j") {
			player.seekTo(player.getCurrentTime() - 5);
		} else if (e.key == "l") {
			player.seekTo(player.getCurrentTime() + 5);
		} else if (e.key == ",") {
			player.seekTo(player.getCurrentTime() - 0.1);
		} else if (e.key == ".") {
			player.seekTo(player.getCurrentTime() + 0.1);
		} else if (e.key == "q") {
			this.#setZoomLevelPos(this.maxZoomLevel, -2)
		} else if (e.key == "w") {
			this.#setZoomLevelPos(this.maxZoomLevel, -1)
		} else if (e.key == "e") {
			this.#setZoomLevelPos(this.maxZoomLevel, 0)
		} else if (e.key == "r") {
			this.#setZoomLevelPos(this.maxZoomLevel, 1)
		} else if (e.key == "t") {
			this.#setZoomLevelPos(this.maxZoomLevel, 2)
		} else if (e.key == " ") {
			this.#setZoomLevelPos(this.#getToggledZoomLevel(), this.zoomLevel)
		}
	}

	#seekToNextEvent() {
		let t = this.ytPlayer.getCurrentTime();
		let timestamps = this.dataRecorder.getEventTimestamps();
		timestamps.push(t);
		timestamps = Array.from(new Set(timestamps));
		timestamps.sort(function(a, b) {
			return a - b;
		});
		let i = timestamps.indexOf(t);
		if (i >= 0 && i + 1 < timestamps.length) {
			this.ytPlayer.seekTo(timestamps[i + 1]);
		}
	}

	#seekToPrevEvent() {
		let t = this.ytPlayer.getCurrentTime();
		let timestamps = this.dataRecorder.getEventTimestamps();
		timestamps.push(t);
		timestamps = Array.from(new Set(timestamps));
		timestamps.sort(function(a, b) {
			return a - b;
		});
		let i = timestamps.indexOf(t);
		if (i - 1 >= 0) {
			this.ytPlayer.seekTo(timestamps[i - 1]);
		}
	}

	#getToggledZoomLevel() {
		return this.zoomLevel == this.minZoomLevel ? this.maxZoomLevel : this.minZoomLevel;
	}

	#animationStep(timeMS) {
		const time = timeMS / 1000.0
		const dt = time - this.prevAnimateTime

		let zoomTargetTargetScale = this.zoomLevel == this.maxZoomLevel ? this.maxZoomScale : this.minZoomScale;
		let zoomTargetTargetOriginX = this.#map(this.minZoomPos, this.maxZoomPos, 0, 100, this.zoomPos);

		if (this.zoomLevel > this.minZoomLevel && this.prevZoomLevel == this.minZoomLevel) {
			this.startZoomInTime = time;
			if (this.zoomScale <= this.minZoomScale) {
				this.zoomTargetOriginX = zoomTargetTargetOriginX;
				this.zoomOriginX = zoomTargetTargetOriginX;
			}
		}
		
		this.zoomTargetScale = this.#lerp(this.zoomTargetScale, zoomTargetTargetScale, dt * 3.0);
		this.zoomScale = this.#lerp(this.zoomScale, this.zoomTargetScale, dt * 3.0);

		let zoomT = this.#map(this.minZoomScale, this.maxZoomScale, 0.0, 1.0, this.zoomScale);
		let zoomInLerpFactor = this.#map(0.0, 1.0, dt * 20.0, dt * 1.0, 1.0 - Math.pow(1.0 - zoomT, 4.0));
		let lerpFactor = this.#map(0.0, 1.0, zoomInLerpFactor, dt * 1.0, time - this.startZoomInTime);
		this.zoomTargetOriginX = this.#lerp(this.zoomTargetOriginX, zoomTargetTargetOriginX, lerpFactor);
		this.zoomOriginX = this.#lerp(this.zoomOriginX, this.zoomTargetOriginX, lerpFactor);

		this.#zoom(this.zoomScale, this.zoomOriginX);

		// Prevent Iframe from stealing focus!
		if (!this.allowFocusCheckbox.checked && document.activeElement.tagName == "IFRAME") {
			document.activeElement.blur();
		}

		this.prevAnimateTime = time;
		this.prevZoomLevel = this.zoomLevel;
		requestAnimationFrame(this.#animationStep.bind(this));
	}

	#lerp(a, b, t) {
		t = this.#clamp(t, 0.0, 1.0);
		return (1 - t) * a + t * b;
	}

	#clamp(value, min, max) {
		return Math.min(Math.max(min, value), max);
	}
		
	#map(inputMin, inputMax, outputMin, outputMax, value) {
		if (inputMin > inputMax) {
			return this.#map(inputMax, inputMin, outputMax, outputMin, value);
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

	#setZoomLevelPos(level, pos) {
		this.zoomLevel = level;
		this.zoomPos = pos;
	}

	#zoom(scale, originX=50, originY=50) {
		if (!this.ytPlayer) {
			return
		}
		let iframe = this.ytPlayer.getIframe();
		iframe.style.transform = `scale(${scale})`;
		iframe.style.transformOrigin = `${originX}% ${originY}%`
	}
}

export const registerVideoController = () => customElements.define('video-controller', VideoController);