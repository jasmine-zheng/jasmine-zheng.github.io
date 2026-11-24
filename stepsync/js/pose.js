// Pure pose logic: no DOM. Angles are degrees in screen space (y down):
// 0 = pointing down, 90 = screen-right, ±180 = up, -90 = screen-left.
// L/R are screen sides (camera image is mirrored, like a dance-studio mirror).

export const SEGMENTS = {
  torso: [[23, 24], [11, 12]],
  uaL: [11, 13], faL: [13, 15], uaR: [12, 14], faR: [14, 16],
  thL: [23, 25], shL: [25, 27], thR: [24, 26], shR: [26, 28],
};

const ARMS = ['uaL', 'faL', 'uaR', 'faR'];
const LEGS = ['thL', 'shL', 'thR', 'shR'];
const WEIGHTS = { torso: 0.5, ...Object.fromEntries(ARMS.map(k => [k, 1])), ...Object.fromEntries(LEGS.map(k => [k, 0.6])) };

export const wrap = a => ((((a + 180) % 360) + 360) % 360) - 180;
export const angleDiff = (a, b) => wrap(a - b);
export const angleOf = (dx, dy) => (Math.atan2(dx, dy) * 180) / Math.PI;

// Mirror MediaPipe normalized landmarks so the user's left side appears on screen-left.
export const mirror = lms => lms.map(p => ({ ...p, x: 1 - p.x }));

const point = (lms, idx, aspect) => {
  const ids = Array.isArray(idx) ? idx : [idx];
  const ps = ids.map(i => lms[i]);
  return {
    x: (ps.reduce((s, p) => s + p.x, 0) / ps.length) * aspect,
    y: ps.reduce((s, p) => s + p.y, 0) / ps.length,
    v: Math.min(...ps.map(p => p.visibility ?? 1)),
  };
};

// Mirrored landmarks -> { seg: { angle, visible } }
export function fromLandmarks(lms, aspect = 4 / 3) {
  const out = {};
  for (const [key, [a, b]] of Object.entries(SEGMENTS)) {
    const p = point(lms, a, aspect), q = point(lms, b, aspect);
    let angle = angleOf(q.x - p.x, q.y - p.y);
    if (key === 'torso') angle = wrap(angle - 180);
    out[key] = { angle, visible: Math.min(p.v, q.v) };
  }
  return out;
}

export function segmentScore(d, slow = false) {
  const [lo, hi] = slow ? [20, 55] : [15, 45];
  d = Math.abs(d);
  return d <= lo ? 1 : d >= hi ? 0 : 1 - (d - lo) / (hi - lo);
}

// user: fromLandmarks() output; target: { seg: angle }
export function compare(user, target, { upperOnly = false, slow = false } = {}) {
  const segments = {};
  let sum = 0, wsum = 0, count = 0;
  for (const key of Object.keys(SEGMENTS)) {
    const u = user?.[key];
    const w = upperOnly && LEGS.includes(key) ? 0 : WEIGHTS[key];
    if (!u || u.visible < 0.5 || w === 0) { segments[key] = null; continue; }
    const s = segmentScore(angleDiff(u.angle, target[key]), slow);
    segments[key] = s;
    sum += s * w; wsum += w; count++;
  }
  return { segments, overall: count >= 4 ? sum / wsum : null };
}

export function judge(score) {
  if (score >= 0.85) return { label: 'Perfect!', points: 3 };
  if (score >= 0.65) return { label: 'Great!', points: 2 };
  if (score >= 0.4) return { label: 'Good!', points: 1 };
  return { label: null, points: 0 };
}

export const stars = (points, max) => (max && points / max >= 0.8 ? 3 : max && points / max >= 0.5 ? 2 : 1);

// ---- Routines ----

export function buildRoutine(def, library) {
  const rest = library.rest;
  let start = 0;
  const moves = def.moves.map(m => {
    if (!library[m.pose]) throw new Error(`Unknown pose "${m.pose}" in ${def.id}`);
    const move = { ...m, pose: { ...rest, ...library[m.pose] }, start, judge: m.judge ?? !!m.label };
    start += m.beats;
    return move;
  });
  return { ...def, moves, rest, totalBeats: start };
}

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function lerpPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(a)) out[k] = wrap(a[k] + angleDiff(b[k], a[k]) * t);
  return out;
}

export function moveIndexAt(routine, beat) {
  const { moves } = routine;
  if (beat < 0) return -1;
  for (let i = moves.length - 1; i >= 0; i--) if (beat >= moves[i].start) return i;
  return -1;
}

// Dancer eases into each pose during the first 60% of a move, then holds it.
export function poseAt(routine, beat) {
  const i = moveIndexAt(routine, beat);
  if (i < 0) return { ...routine.rest };
  const m = routine.moves[i];
  if (beat >= routine.totalBeats) return { ...m.pose };
  const prev = i > 0 ? routine.moves[i - 1].pose : routine.rest;
  const t = Math.min(1, (beat - m.start) / (m.beats * 0.6));
  return lerpPose(prev, m.pose, ease(t));
}
