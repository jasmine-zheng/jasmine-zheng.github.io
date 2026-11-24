// Built-in beat + simple melody with Web Audio, scheduled ahead against a performance.now() dance clock.

const CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C G Am F
const midi = n => 440 * Math.pow(2, (n - 69) / 12);

export class BeatBox {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, len);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.ctx;
  }

  // Call synchronously inside a click handler (Safari only allows audio started from a user gesture).
  unlock() { this._ensure().resume(); }

  start(bpm, countIn = 4, calm = false) {
    this._ensure().resume();
    this.calm = calm;
    this.spb = 60 / bpm;
    this.t0 = this._now() + 0.15 + countIn * this.spb;
    this.nextStep = -countIn * 2;
    this.pausedAt = null;
    this._run();
  }

  // The dance clock runs on performance.now() so the dancer keeps moving even if audio is unavailable.
  _now() { return performance.now() / 1000; }

  get beat() {
    return this.t0 == null ? -Infinity : ((this.pausedAt ?? this._now()) - this.t0) / this.spb;
  }

  pause() {
    if (this.pausedAt != null) return;
    this.pausedAt = this._now();
    clearInterval(this.timer);
    this.ctx?.suspend();
  }

  resume() {
    if (this.pausedAt == null) return;
    this.t0 += this._now() - this.pausedAt;
    this.pausedAt = null;
    this.ctx?.resume();
    this._run();
  }

  stop() { clearInterval(this.timer); this.timer = null; this.t0 = null; this.pausedAt = null; }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.6; }

  _run() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this._schedule(), 25);
    this._schedule();
  }

  _schedule() {
    const now = this._now(), ctx = this.ctx;
    while (this.t0 + (this.nextStep / 2) * this.spb < now + 0.12) {
      const step = this.nextStep, at = this.t0 + (step / 2) * this.spb;
      this.nextStep++;
      if (at < now - 0.05 || ctx.state !== 'running') continue;
      const t = ctx.currentTime + (at - now);
      if (step < 0) { if (step % 2 === 0) this._beep(t, step === -2 ? 1320 : 880); }
      else this._music(step, t);
    }
  }

  _music(step, t) {
    const beat = step / 2, onBeat = step % 2 === 0, bar = Math.floor(beat / 4);
    const chord = CHORDS[bar % 4];
    if (this.calm) {
      if (beat % 4 === 0 && onBeat) chord.forEach(n => this._tone(t, midi(n), 'sine', 0.07, this.spb * 3.8));
      if (onBeat) this._tone(t, midi(chord[(beat % 3)] + 12), 'triangle', 0.05, this.spb * 0.9);
      return;
    }
    if (onBeat) this._kick(t);
    else this._hat(t);
    if (onBeat && beat % 2 === 1) this._clap(t);
    if (onBeat) this._tone(t, midi(chord[0] - 24), 'square', 0.05, this.spb * 0.45);
    const arp = [0, 1, 2, 1];
    this._tone(t, midi(chord[arp[step % 4]] + 12), 'triangle', 0.06, this.spb * 0.4);
  }

  _env(t, peak, dur) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    return g;
  }

  _tone(t, freq, type, vol, dur) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    o.connect(this._env(t, vol, dur)); o.start(t); o.stop(t + dur + 0.05);
  }

  _beep(t, freq) { this._tone(t, freq, 'sine', 0.25, 0.18); }

  _kick(t) {
    const o = this.ctx.createOscillator();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    o.connect(this._env(t, 0.7, 0.25)); o.start(t); o.stop(t + 0.3);
  }

  _noise(t, type, freq, vol, dur) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    s.connect(f); f.connect(this._env(t, vol, dur)); s.start(t); s.stop(t + dur + 0.05);
  }

  _hat(t) { this._noise(t, 'highpass', 7000, 0.12, 0.05); }
  _clap(t) { this._noise(t, 'bandpass', 1500, 0.35, 0.12); }
}
