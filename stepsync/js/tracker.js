// Webcam + MediaPipe Pose Landmarker. Everything runs locally in the browser.
import { mirror } from './pose.js';

export const MP_VERSION = '1.2.3';
export const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
export const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export class Tracker {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.stream = null;
    this.lastVideoTime = -1;
    this.result = null;
    this.loading = null;
    this.starting = null;
  }

  // Concurrent callers (camera check + Play) share one in-flight load.
  init() {
    if (this.landmarker) return Promise.resolve();
    this.loading ??= this.load().catch(err => {
      this.loading = null;
      throw Object.assign(new Error(`Pose tracker failed to load: ${err?.message ?? err}`), { name: 'TrackerError', cause: err });
    });
    return this.loading;
  }

  async load() {
    const { FilesetResolver, PoseLandmarker } = await import(`${MP_URL}/vision_bundle.mjs`);
    const fileset = await FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
    const make = delegate => PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    });
    try { this.landmarker = await make('GPU'); } catch { this.landmarker = await make('CPU'); }
  }

  startCamera() {
    if (this.stream) return Promise.resolve();
    // Browsers hide navigator.mediaDevices outside secure contexts (https / localhost).
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      return Promise.reject(Object.assign(new Error('Camera needs a secure (https) page'), { name: 'InsecureContextError' }));
    }
    if (!this.starting) {
      const starting = this.starting = (async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
        });
        if (this.starting !== starting) { // stopCamera() was called while waiting for permission
          stream.getTracks().forEach(t => t.stop());
          throw Object.assign(new Error('Camera was stopped'), { name: 'CameraStoppedError' });
        }
        this.stream = stream;
        this.video.srcObject = stream;
        await this.video.play();
      })();
      starting.catch(() => {}).finally(() => { if (this.starting === starting) this.starting = null; });
    }
    return this.starting;
  }

  stopCamera() {
    this.starting = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  get ready() {
    return !!(this.stream && this.landmarker);
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
