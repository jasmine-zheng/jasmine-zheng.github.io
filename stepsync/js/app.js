import { buildRoutine, poseAt, moveIndexAt, fromLandmarks, compare, judge, stars, SEGMENTS } from './pose.js';
import { POSES, ROUTINES, MUSIC } from './routines.js';
import { CHARACTERS, drawDancer } from './dancer.js';
import { BeatBox } from './audio.js';
import { Tracker } from './tracker.js';

const $ = id => document.getElementById(id);
const routines = ROUTINES.map(r => buildRoutine(r, POSES));
const audio = new BeatBox();
const tracker = new Tracker($('video'));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const settings = { routine: 0, character: 'sunny', speed: 0.75, camera: true, upperOnly: false, avatar: false };
let screen = 'start';
let game = null;
let preview = false;
let previewRun = 0;

// ---------- helpers ----------

function fit(canvas) {
  const dpr = devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function drawIn(canvas, pose, extra = {}) {
  const { ctx, w, h } = fit(canvas);
  const height = Math.min(h * 0.82, w * 1.15);
  if (extra.ghostPose) drawDancer(ctx, extra.ghostPose, { cx: w / 2, groundY: h * 0.93, height, character: settings.character, ghost: true });
  drawDancer(ctx, pose, { cx: w / 2, groundY: h * 0.93, height, character: settings.character, ...extra });
}

function show(name) {
  screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${name}`));
  window.scrollTo(0, 0);
}

function toast(msg, ms = 4000) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), ms);
}

// ---------- camera ----------

const CAMERA_PROBLEMS = {
  InsecureContextError: 'The camera only works on the secure page (https).',
  NotAllowedError: 'The camera is blocked. Click the camera icon in the address bar and choose Allow.',
  SecurityError: 'The camera is blocked. Click the camera icon in the address bar and choose Allow.',
  NotFoundError: "We couldn't find a camera on this device.",
  OverconstrainedError: "We couldn't find a camera on this device.",
  NotReadableError: 'Another app is using the camera. Close it and try again.',
  AbortError: 'Another app is using the camera. Close it and try again.',
  TrackerError: "The dance tracker couldn't load. Check the internet and try again.",
};
const cameraProblem = err => CAMERA_PROBLEMS[err?.name] ?? 'The camera is not available right now.';

async function startTracking(onStep = () => {}) {
  onStep('Waking up the camera...');
  await tracker.startCamera();
  onStep('Getting the dance tracker ready...');
  await tracker.init();
}

function setCamStatus(msg, ok = false) {
  const el = $('camStatus');
  if (el.textContent !== msg) el.textContent = msg;
  el.classList.toggle('ok', ok);
}

async function startPreview() {
  const run = ++previewRun;
  preview = true;
  $('camCheck').classList.add('on');
  $('camCheckBtn').textContent = 'Stop camera';
  try {
    await startTracking(msg => run === previewRun && setCamStatus(msg));
    if (run !== previewRun) tracker.stopCamera(); // stopped while the camera was still starting
  } catch (err) {
    console.warn(err);
    if (run !== previewRun) return;
    stopPreview();
    $('camCheck').classList.add('on');
    setCamStatus(cameraProblem(err));
  }
}

function stopPreview() {
  previewRun++;
  preview = false;
  tracker.stopCamera();
  $('camCheck').classList.remove('on');
  $('camCheckBtn').textContent = 'Check my camera';
}

function drawPreview() {
  if (!preview || !tracker.ready) return;
  const lms = tracker.detect();
  drawCamera($('previewCanvas'), lms, {});
  if (!lms) return setCamStatus("I can't see you yet. Stand in front of the camera!");
  const user = fromLandmarks(lms, tracker.aspect);
  const needed = Object.keys(SEGMENTS).filter(k => !settings.upperOnly || !/^(th|sh)/.test(k));
  const missing = needed.filter(k => user[k].visible < 0.5);
  if (!missing.length) setCamStatus('I can see you! Press "Let\'s Dance!" when you are ready.', true);
  else if (missing.some(k => /^(ua|fa)/.test(k))) setCamStatus('Step back so I can see both arms!');
  else setCamStatus(settings.upperOnly ? 'Step back a little so I can see you!' : 'Step back so I can see your legs and feet!');
}

function retrigger(el, cls) {
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

const idleBeat = (bpm = 100) => (performance.now() / 1000) * (bpm / 60);
const loopPose = (r, beat) => poseAt(r, 2 + (beat % (r.totalBeats - 2)));

// ---------- start screen ----------

function renderMenus() {
  $('routineList').innerHTML = routines.map((r, i) => `
    <button class="card ${i === settings.routine ? 'on' : ''}" data-i="${i}" style="--accent:${r.color};--tint:${r.color}22">
      <div class="stripe"></div>
      <h3>${r.title}</h3><p>${r.subtitle}</p>
      <span class="meta">${r.keys ? `AI dance &middot; ${Math.round(r.totalBeats * 60 / r.bpm)} s &middot; own music` : `${r.moves.filter(m => m.judge).length} moves &middot; ${r.bpm} bpm`}</span>
    </button>`).join('');
  $('charList').innerHTML = Object.entries(CHARACTERS).map(([id, c]) => `
    <button class="card ${id === settings.character ? 'on' : ''}" data-id="${id}" style="--accent:${c.body}">
      <canvas></canvas><h3>${c.name}</h3>
    </button>`).join('');
  // Dances extracted from video come with their own music and play at the music's speed.
  const own = routines[settings.routine].music;
  $('speedSeg').querySelectorAll('button').forEach(b => {
    b.disabled = !!own;
    b.classList.toggle('on', +b.dataset.speed === (own ? 1 : settings.speed));
  });
}

$('routineList').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  settings.routine = +card.dataset.i; renderMenus();
});
$('charList').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  settings.character = card.dataset.id; renderMenus();
});
$('speedSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.disabled) return;
  settings.speed = +b.dataset.speed;
  $('speedSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
});
$('camToggle').addEventListener('change', e => {
  settings.camera = e.target.checked;
  $('camCheckBtn').disabled = !settings.camera;
  if (!settings.camera && preview) stopPreview();
});
$('camCheckBtn').addEventListener('click', () => (preview ? stopPreview() : startPreview()));
$('upperToggle').addEventListener('change', e => (settings.upperOnly = e.target.checked));
$('avatarToggle').addEventListener('change', e => (settings.avatar = e.target.checked));
$('muteBtn').addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  $('muteBtn').textContent = `Sound: ${audio.muted ? 'off' : 'on'}`;
});

function drawStart() {
  const r = routines[settings.routine];
  const beat = idleBeat(r.bpm);
  drawIn($('heroDancer'), loopPose(r, beat), { beat });
  document.querySelectorAll('#charList .card').forEach(card => {
    const canvas = card.querySelector('canvas');
    const { ctx, w, h } = fit(canvas);
    const pose = loopPose(routines[0], beat + 3);
    drawDancer(ctx, pose, { cx: w / 2, groundY: h * 0.95, height: h * 0.85, character: card.dataset.id, beat });
  });
  drawPreview();
}

// ---------- game ----------

async function startGame() {
  audio.unlock();
  audio.stopPreview();
  const routine = routines[settings.routine];
  const music = MUSIC.find(m => m.id === routine.music);
  const speed = routine.music ? 1 : settings.speed;
  const trackP = music?.src
    ? audio.load(music.src).then(buffer => ({ buffer, fadeOut: music.fadeOut })).catch(err => {
      console.warn(err); toast(`Couldn't load "${music.title}". The StepSync beat will play instead.`); return null;
    })
    : null;
  let useCamera = settings.camera;
  if (preview) { preview = false; $('camCheck').classList.remove('on'); $('camCheckBtn').textContent = 'Check my camera'; }
  if (useCamera && !tracker.ready) {
    $('loading').classList.remove('hidden');
    try {
      await startTracking(msg => ($('loadingText').textContent = msg));
    } catch (err) {
      console.warn(err);
      tracker.stopCamera();
      useCamera = false;
      toast(`${cameraProblem(err)} Let's just watch and dance for fun!`, 7000);
    }
    $('loading').classList.add('hidden');
  }

  const track = await trackP;

  game = {
    routine, useCamera, speed, paused: false,
    score: 0, combo: 0, maxPoints: routine.moves.filter(m => m.judge).length * 3,
    counts: { 'Perfect!': 0, 'Great!': 0, 'Good!': 0 },
    smooth: 0, best: 0, judgeIdx: -1, lastSeen: performance.now(),
    lastLabelIdx: -2, lastCount: null, cheerUntil: 0, segScores: {},
  };
  $('stage').classList.toggle('solo', !useCamera);
  $('scoreVal').textContent = '0';
  $('combo').textContent = '';
  $('moveLabel').textContent = 'Get ready!';
  $('pauseBtn').textContent = 'Pause';
  show('play');
  audio.start(routine.bpm * speed, 4, !!routine.calm, track);
}

function stopGame() {
  audio.stop();
  tracker.stopCamera();
}

function finishMove(idx) {
  const m = game.routine.moves[idx];
  if (!m?.judge) return;
  const { label, points } = judge(game.best);
  game.best = 0;
  if (!points) { game.combo = 0; $('combo').textContent = ''; return; }
  game.score += points;
  game.combo++;
  game.counts[label]++;
  $('scoreVal').textContent = game.score;
  $('combo').textContent = game.combo >= 2 ? `${game.combo}x combo!` : '';
  const pop = $('popup');
  pop.textContent = label;
  pop.className = `popup ${label.replace('!', '').toLowerCase()}`;
  retrigger(pop, 'show');
  if (points === 3 || game.combo % 3 === 0) { confetti(points === 3 ? 60 : 30); game.cheerUntil = performance.now() + 900; }
}

function drawCamera(canvas, lms, segScores) {
  const v = $('video');
  const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
  if (canvas.width !== vw || canvas.height !== vh) { canvas.width = vw; canvas.height = vh; }
  const ctx = canvas.getContext('2d');
  if (settings.avatar) return drawAvatar(ctx, vw, vh, lms, segScores);
  ctx.save(); ctx.translate(vw, 0); ctx.scale(-1, 1); ctx.drawImage(v, 0, 0, vw, vh); ctx.restore();
  ctx.fillStyle = 'rgba(45,48,71,0.15)'; ctx.fillRect(0, 0, vw, vh);
  if (!lms) return;
  const { P, mid } = landmarkPoints(lms, vw, vh);
  ctx.lineCap = 'round';
  for (const [key, [a, b]] of Object.entries(SEGMENTS)) {
    const p = Array.isArray(a) ? mid(...a) : P(a), q = Array.isArray(b) ? mid(...b) : P(b);
    const s = segScores[key];
    const color = s == null ? 'rgba(255,255,255,0.35)' : segColor(s, 'rgba(255,255,255,0.85)');
    ctx.lineWidth = key === 'torso' ? 18 : 12;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.moveTo(p.x, p.y + 2); ctx.lineTo(q.x, q.y + 2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  }
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    if ((lms[i].visibility ?? 1) < 0.5) continue;
    const p = P(i);
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  const nose = P(0);
  ctx.beginPath(); ctx.arc(nose.x, nose.y, 10, 0, Math.PI * 2); ctx.fillStyle = '#ff6b9a'; ctx.fill();
}

const landmarkPoints = (lms, vw, vh) => {
  const P = i => ({ x: lms[i].x * vw, y: lms[i].y * vh });
  return { P, mid: (a, b) => ({ x: (P(a).x + P(b).x) / 2, y: (P(a).y + P(b).y) / 2 }) };
};
const segColor = (s, base) => (s == null ? base : s >= 0.75 ? '#1dd1a1' : s >= 0.4 ? '#feca57' : base);

// Privacy mode: never draw camera pixels, only a faceless character that follows the tracked body.
function drawAvatar(ctx, vw, vh, lms, segScores) {
  const bg = ctx.createLinearGradient(0, 0, 0, vh);
  bg.addColorStop(0, '#3a3f6b'); bg.addColorStop(1, '#2d3047');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, vw, vh);
  if (!lms) return;
  const { P, mid } = landmarkPoints(lms, vw, vh);
  const vis = i => (lms[i].visibility ?? 1) >= 0.5;
  const sh = Math.max(20, Math.hypot(P(11).x - P(12).x, P(11).y - P(12).y));
  const base = '#a29bfe', outline = '#1e1b2e';
  const stroke = (p, q, w, color) => {
    ctx.lineWidth = w + 6; ctx.strokeStyle = outline;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  };
  const dot = (c, r, color) => {
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = outline; ctx.stroke();
  };
  ctx.lineCap = 'round';
  for (const [key, [a, b]] of Object.entries(SEGMENTS)) {
    const ends = [a, b].flat();
    if (key === 'torso' || !ends.every(vis)) continue;
    const p = Array.isArray(a) ? mid(...a) : P(a), q = Array.isArray(b) ? mid(...b) : P(b);
    stroke(p, q, sh * 0.3, segColor(segScores[key], base));
  }
  if ([11, 12, 23, 24].every(vis)) stroke(mid(11, 12), mid(23, 24), sh * 0.85, segColor(segScores.torso, '#6c5ce7'));
  for (const i of [15, 16]) if (vis(i)) dot(P(i), sh * 0.13, '#dfe6e9');
  for (const i of [27, 28]) if (vis(i)) dot(P(i), sh * 0.14, '#ff6b9a');
  const neck = mid(11, 12), nose = P(0);
  const up = { x: nose.x - neck.x, y: nose.y - neck.y }, len = Math.hypot(up.x, up.y) || 1;
  const r = sh * 0.38;
  dot({ x: neck.x + (up.x / len) * Math.max(len, r * 1.3), y: neck.y + (up.y / len) * Math.max(len, r * 1.3) }, r, '#ffeaa7');
}

function playFrame() {
  const g = game, r = g.routine;
  const beat = audio.beat;

  // countdown
  const n = beat < 0 ? Math.ceil(-beat) : null;
  if (n !== g.lastCount) {
    g.lastCount = n;
    const cd = $('countdown');
    cd.textContent = n == null ? '' : ['', 'Go!', '1', '2', '3'][n] ?? '';
    if (n != null) retrigger(cd, 'pop');
  }

  const i = moveIndexAt(r, beat);
  const move = r.moves[i];
  // Video dances move continuously: compare with where the buddy was a moment ago (people react after seeing it).
  const target = r.keys ? poseAt(r, Math.max(0, beat - r.lagBeats)) : move ? move.pose : r.rest;

  // labels
  if (i !== g.lastLabelIdx && move?.label) {
    $('moveLabel').textContent = move.label;
    retrigger($('moveLabel'), 'bump');
  }
  g.lastLabelIdx = i;
  const next = r.moves[i + 1];
  const nearEnd = !r.keys && move && next && beat > move.start + move.beats - 1;
  $('nextLabel').textContent = next?.label ? `Next: ${next.label}` : '';
  $('nextLabel').classList.toggle('show', !!(nearEnd && next.label));

  // camera + scoring
  let segScores = {};
  if (g.useCamera && !g.paused) {
    const lms = tracker.detect();
    const res = lms ? compare(fromLandmarks(lms, tracker.aspect), target, { upperOnly: settings.upperOnly, slow: g.speed < 0.75 }) : null;
    segScores = res?.segments ?? {};
    if (res?.overall != null) {
      g.lastSeen = performance.now();
      g.smooth = g.smooth * 0.7 + res.overall * 0.3;
    } else g.smooth *= 0.9;
    $('camHint').classList.toggle('show', performance.now() - g.lastSeen > 1500);
    $('meterFill').style.height = `${Math.round(g.smooth * 100)}%`;
    drawCamera($('camCanvas'), lms, segScores);

    // Judge each move in a window that lags the beat a little (kids react after seeing the move).
    const jb = beat - 0.3;
    const ji = moveIndexAt(r, jb);
    if (ji !== g.judgeIdx) { finishMove(g.judgeIdx); g.judgeIdx = ji; g.best = 0; }
    const jm = r.moves[ji];
    if (jm?.judge && jb >= jm.start + jm.beats * 0.35) g.best = Math.max(g.best, g.smooth);
  }
  g.segScores = segScores;

  drawIn($('dancerCanvas'), poseAt(r, beat), {
    beat,
    ghostPose: nearEnd ? next.pose : null,
    mood: performance.now() < g.cheerUntil ? 'cheer' : 'happy',
    glow: segScores,
  });
  $('progressFill').style.width = `${Math.max(0, Math.min(1, beat / r.totalBeats)) * 100}%`;

  if (beat > r.totalBeats + 0.5) endGame();
}

function endGame() {
  const g = game;
  if (g.useCamera) finishMove(g.judgeIdx);
  stopGame();
  const s = g.useCamera ? stars(g.score, g.maxPoints) : 0;
  $('resultTitle').textContent = !g.useCamera ? 'Great dancing!' : ['', 'Nice try, superstar!', 'Great dancing!', 'Amazing dancing!'][s];
  $('stars').innerHTML = g.useCamera
    ? [1, 2, 3].map(k => `<span class="${k <= s ? 'on' : ''}" style="animation-delay:${k * 0.25}s">&#9733;</span>`).join('')
    : '';
  $('tally').innerHTML = g.useCamera
    ? `<div><b>${g.score}</b>points</div>` + Object.entries(g.counts).map(([k, v]) => `<div><b>${v}</b>${k}</div>`).join('')
    : '<div>Turn on the camera next time to earn stars!</div>';
  show('results');
  if (s >= 2 || !g.useCamera) confetti(120);
}

$('playBtn').addEventListener('click', startGame);
$('againBtn').addEventListener('click', startGame);
$('menuBtn').addEventListener('click', () => show('start'));
$('exitBtn').addEventListener('click', () => { stopGame(); $('countdown').textContent = ''; show('start'); });
$('pauseBtn').addEventListener('click', togglePause);
function togglePause() {
  if (screen !== 'play') return;
  game.paused = !game.paused;
  game.paused ? audio.pause() : audio.resume();
  $('pauseBtn').textContent = game.paused ? 'Resume' : 'Pause';
}
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && screen === 'play') { e.preventDefault(); togglePause(); }
  if (e.code === 'Escape' && screen === 'play') $('exitBtn').click();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'play' && !game.paused) togglePause();
  if (document.hidden && preview) stopPreview();
});

// ---------- results ----------

function drawResults() {
  const beat = idleBeat(110);
  const pose = Math.floor(beat / 2) % 2 ? POSES.star : POSES.armsUp;
  drawIn($('resultDancer'), { ...POSES.rest, ...pose }, { beat, mood: 'cheer' });
}

// ---------- confetti ----------

const particles = [];
const COLORS = ['#ff6b9a', '#feca57', '#1dd1a1', '#54a0ff', '#a55eea', '#ff9f43'];
function confetti(n) {
  if (reduceMotion) return;
  const w = innerWidth;
  for (let k = 0; k < n; k++) {
    particles.push({
      x: w / 2 + (Math.random() - 0.5) * w * 0.4, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      s: 6 + Math.random() * 8, c: COLORS[k % COLORS.length], life: 1,
    });
  }
}
function drawFx() {
  const { ctx } = fit($('fx'));
  for (let k = particles.length - 1; k >= 0; k--) {
    const p = particles[k];
    p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.008;
    if (p.life <= 0 || p.y > innerHeight + 20) { particles.splice(k, 1); continue; }
    ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 2); ctx.translate(p.x, p.y); ctx.rotate(p.r);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
  }
}

// ---------- main loop ----------

function frame() {
  if (screen === 'start') drawStart();
  else if (screen === 'play' && game) playFrame();
  else if (screen === 'results') drawResults();
  drawFx();
  requestAnimationFrame(frame);
}

renderMenus();
requestAnimationFrame(frame);

