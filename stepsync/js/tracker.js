// Webcam + MediaPipe Pose Landmarker. Everything runs locally in the browser.
import { mirror } from './pose.js';

const MP_VERSION = '1.2.3';
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export class Tracker {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.stream = null;
    this.lastVideoTime = -1;
    this.result = null;
  }

  async init() {
    if (this.landmarker) return;
    const { FilesetResolver, PoseLandmarker } = await import(`${MP_URL}/vision_bundle.mjs`);
    const fileset = await FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
    const make = delegate => PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
    try { this.landmarker = await make('GPU'); } catch { this.landmarker = await make('CPU'); }
  }

  async startCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  stopCamera() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  get aspect() {
    return this.video.videoWidth / this.video.videoHeight || 4 / 3;
  }

  // Returns mirrored normalized landmarks (or null if nobody is visible).
  detect() {
    const v = this.video;
    if (!this.landmarker || v.readyState < 2) return null;
    if (v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      const res = this.landmarker.detectForVideo(v, performance.now());
      this.result = res.landmarks?.[0] ? mirror(res.landmarks[0]) : null;
    }
    return this.result;
  }
}
