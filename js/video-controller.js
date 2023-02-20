import { DataRecorder } from "./data-recorder.js"

export class VideoController extends HTMLElement {
	constructor() {
		super();
		this.ytPlayer = null;
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
			this.ytPlayer = new YT.Player("player", {
				videoId: "LfduUFF_i1A",
				playerVars: {
					"playsinline": 1
				},
				events: {
					"onReady": onPlayerReady,
					"onStateChange": onPlayerStateChange
				}
			});
		};

		// Called by YT API. Function must be defined.
		window.onPlayerReady = (e) => {
		};

		// Called by YT API. Function must be defined.
		window.onPlayerStateChange = (e) => {
		};

		addEventListener("keypress", this.#onKeyPress.bind(this));

		// Handle config changes.
		let dataRecorder = document.getElementsByTagName("data-recorder")[0];
		console.log(dataRecorder.subscribeConfigChanged);
		dataRecorder.subscribeConfigChanged(this.#onConfigChanged.bind(this));
	}

	#onConfigChanged(dataRecorder) {
		if (this.ytPlayer) {
			let oldVideoId = this.ytPlayer.getVideoData()['video_id'];
			let newVideoId = dataRecorder.videoId;
			if (newVideoId != oldVideoId) {
				this.ytPlayer.loadVideoById(newVideoId);
			}
		}	
	}

	#onKeyPress(e) {
		let player = this.ytPlayer;
		if (e.key == "k") {
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
		}
	}
}

export const registerVideoController = () => customElements.define('video-controller', VideoController);