import { registerDataRecorder } from "./data-recorder.js"
import { registerVideoController } from "./video-controller.js"

const app = async () => {
	registerDataRecorder();
	registerVideoController();
};

document.addEventListener("DOMContentLoaded", app);