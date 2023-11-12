import { defaultYtVideoId } from "./common.js"

export class VideoController extends HTMLElement {
	constructor() {
		super();

		this.ytPlayer = null;
		this.customPlayer = document.getElementsByClassName("video-section__custom-player")[0];
		this.customPlayerFile = null;

		this.hasShownFullscreenAlert = false;
		this.allowFocusCheckbox = document.getElementById("allow-focus-checkbox");
		this.dataRecorder = document.getElementsByTagName("data-recorder")[0];

		this.overlayText = document.getElementsByClassName("overlay-text")[0];
		this.overlayBg = document.getElementsByClassName("overlay-bg")[0];
		this.hideOverlayTextTimeout;
		this.hideOverlayBgTimeout;

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
		this.zoomTargetOriginX = 50.0;
		this.zoomOriginX = 50.0;
		this.prevAnimateTime = 0;
		this.startZoomInTime = 0;

		this.#init();
	}

	#init() {
		this.#initYTPlayer();
		
		// Animation.
		requestAnimationFrame(this.#animationStep.bind(this));

		// Handle config changes.
		this.dataRecorder.subscribeConfigChanged(this.#onConfigChanged.bind(this));

		addEventListener("keypress", this.#onKeyPress.bind(this));
		addEventListener("keydown", this.#onKeyDown.bind(this));
		document.addEventListener('fullscreenchange', this.#onFullscreenChanged.bind(this));
	}

	#initYTPlayer() {
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
			let urlYtVideoId = params.get("v");
			let videoId = urlYtVideoId != null && urlYtVideoId.length > 0 ? urlYtVideoId : defaultYtVideoId;

			this.ytPlayer = new YT.Player("player", {
				videoId: videoId,
				playerVars: {
					"playsinline": 1,
					"fs": 0,
					"rel": 0,
					"color": "white"
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
	}

	#onFullscreenChanged() {
		if (document.fullscreenElement) {
			if (document.fullscreenElement == this.customPlayer && !this.hasShownFullscreenAlert) {
				window.alert("The fullscreen button doesn't play nice with kittiestats! Use the f hotkey to enter fullscreen instead.");
				this.hasShownFullscreenAlert = true;
			}
		}
		else {
			this.hasShownFullscreenAlert = false;
		}
	}

	#onConfigChanged(dataRecorder) {
		// Youtube video.
		let ytVideoId = dataRecorder.getYtVideoId();
		if (ytVideoId) {
			this.#playYtVideo(ytVideoId);
			this.#showPlayer(true);
			return;
		}

		// Custom video.
		let customVideoFile = dataRecorder.getCustomVideoFile();
		if (customVideoFile) {
			this.#playCustomVideo(customVideoFile);
			this.#showPlayer(false);
			return;
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
			if (this.isPlaying()) {
				this.#pause();
			} else {
				this.#play();
			}
		} else if (e.key == "j") {
			this.#seekTo(this.getCurrentTime() - 5);
		} else if (e.key == "l") {
			this.#seekTo(this.getCurrentTime() + 5);
		} else if (e.key == ",") {
			this.#seekTo(this.getCurrentTime() - 0.1);
		} else if (e.key == ".") {
			this.#seekTo(this.getCurrentTime() + 0.1);
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

	#playYtVideo(videoId) {
		if (this.ytPlayer && this.ytPlayer.getVideoData) {
			let oldVideoId = this.ytPlayer.getVideoData()['video_id'];
			if (videoId != oldVideoId) {
				this.ytPlayer.loadVideoById(videoId);
			}
		}	
	}

	#playCustomVideo(file) {
		if (this.customPlayerFile == file)
		{
			return;
		}
		var canPlay = this.customPlayer.canPlayType(file.type);
		var isError = canPlay === 'no';
		if (isError) {
			return;
		}
		this.customPlayerFile = file;
		this.customPlayer.src = URL.createObjectURL(file);
	}

	#usingYtPlayer() {
		return this.customPlayer.classList.contains("hidden")
	}

	#showPlayer(showYtPlayer) {
		if (this.ytPlayer) {
			let iframe = this.ytPlayer.getIframe();
			iframe.classList.toggle("hidden", !showYtPlayer);
			if (!showYtPlayer) {
				this.ytPlayer.stopVideo();
			}
		}

		this.customPlayer.classList.toggle("hidden", showYtPlayer);
		if (showYtPlayer) {
			this.customPlayer.src = null;
		}
	}

	#play() {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				this.ytPlayer.playVideo();
			}
		} else {
			this.customPlayer.play();
		}
	}

	#pause() {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				this.ytPlayer.pauseVideo();
			}
		} else {
			this.customPlayer.pause();
		}
	}

	isPlaying() {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				return this.ytPlayer.getPlayerState() == YT.PlayerState.PLAYING;
			}
		} else {
			return !this.customPlayer.paused;
		}
		return false;
	}

	getCurrentTime() {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				return this.ytPlayer.getCurrentTime();
			}
		} else {
			return this.customPlayer.currentTime;
		}
		return false;
	}

	#seekTo(time) {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				this.ytPlayer.seekTo(time);
			}
		} else {
			this.customPlayer.currentTime = time;
		}
	}

	#seekToNextEvent() {
		let t = this.getCurrentTime();
		let timestamps = this.dataRecorder.getEventTimestamps();
		timestamps.push(t);
		timestamps = Array.from(new Set(timestamps));
		timestamps.sort(function(a, b) {
			return a - b;
		});
		let i = timestamps.indexOf(t);
		if (i >= 0 && timestamps.length > 1) {
			i = (i + 1) % timestamps.length;
			this.#seekToEventTime(timestamps[i]);
		}
	}

	#seekToPrevEvent() {
		let t = this.getCurrentTime();
		let timestamps = this.dataRecorder.getEventTimestamps();
		timestamps.push(t);
		timestamps = Array.from(new Set(timestamps));
		timestamps.sort(function(a, b) {
			return a - b;
		});
		let i = timestamps.indexOf(t);
		if (i >= 0 && timestamps.length > 1) {
			i = this.#modulo(i - 1, timestamps.length);
			this.#seekToEventTime(timestamps[i]);
		}
	}

	#seekToEventTime(time) {
		this.#seekTo(time);
		this.#resetCamera();
		this.#play();

		// Show minute overlay.
		let minute = Math.floor(time / 60) + 1;
		this.overlayText.innerHTML = `${minute}'`
		this.overlayText.classList.toggle("overlay-text--hidden", false);
		if (this.hideOverlayTextTimeout) {
			clearTimeout(this.hideOverlayTextTimeout);
		}
		this.hideOverlayTextTimeout = setTimeout(function() {
			this.overlayText.classList.toggle("overlay-text--hidden", true);
			// this.ytPlayer.playVideo();
		}.bind(this), 1500);
		
		// Background to hide buffering.
		// this.overlayBg.classList.toggle("overlay-bg--hidden", false);
		// if (this.hideOverlayBgTimeout) {
		// 	clearInterval(this.hideOverlayBgTimeout);
		// }
		// this.hideOverlayBgTimeout = setInterval(function() {
		// 	if (this.ytPlayer.getPlayerState() != YT.PlayerState.BUFFERING) {
		// 		this.overlayBg.classList.toggle("overlay-bg--hidden", true);
		// 		clearInterval(this.hideOverlayBgTimeout);
		// 	}
		// }.bind(this), 100);
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

		// Prevent player from stealing focus!
		if (!this.allowFocusCheckbox.checked) {
			if (document.activeElement.tagName == "IFRAME" || document.activeElement == this.customPlayer) {
				document.activeElement.blur();
			}
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

	#resetCamera() {
		this.zoomLevel = this.minZoomLevel;
		this.zoomPos = 0;
		this.zoomTargetScale = this.minZoomScale;
		this.zoomScale = this.minZoomScale;
		this.zoomTargetOriginX = 50;
		this.zoomOriginX = 50;
	}

	#zoom(scale, originX=50, originY=50) {
		if (this.#usingYtPlayer()) {
			if (this.ytPlayer) {
				let iframe = this.ytPlayer.getIframe();
				iframe.style.transform = `scale(${scale})`;
				iframe.style.transformOrigin = `${originX}% ${originY}%`;
			}
		} else {
			this.customPlayer.style.transform = `scale(${scale})`;
			this.customPlayer.style.transformOrigin = `${originX}% ${originY}%`;
		}
	}

	#modulo(value, n) {
		return ((value % n) + n) % n;
	}
}

export const registerVideoController = () => customElements.define('video-controller', VideoController);