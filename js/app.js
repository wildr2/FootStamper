import { registerVideoController } from "./video-controller.js"
import { registerRecorder } from "./recorder.js"

const app = async () => {
	registerVideoController();
	registerRecorder();
};

document.addEventListener("DOMContentLoaded", app);