// "Show me as a character": a faceless neon hologram that follows the tracked body. Camera pixels are never drawn.
// Landmarks are smoothed over time, and a joint that drops out is held for a moment (moving with the body)
// and then faded, so limbs don't flicker when the tracker is briefly unsure.
import { SEGMENTS } from './pose.js';

const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const SHOW = 0.5, KEEP = 0.25; // visibility needed to appear / to stay (hysteresis)
const HOLD = 400, FADE = 500; // ms a lost joint is held, then faded out
const SMOOTH = 0.5; // weight of the newest frame (lower = smoother but laggier)

export const segColor = (s, base) => (s == null ? base : s >= 0.75 ? '#1dd1a1' : s >= 0.4 ? '#feca57' : base);

export const createAvatar = () => ({ pts: {}, center: null, sh: null, bg: null });

function update(st, lms, now) {
  const vis = i => (lms[i].visibility ?? 1) >= SHOW;
  const center = lms && vis(11) && vis(12) ? { x: (lms[11].x + lms[12].x) / 2, y: (lms[11].y + lms[12].y) / 2 } : null;
  const shift = center && st.center ? { x: center.x - st.center.x, y: center.y - st.center.y } : null;
  if (center) st.center = center;
  for (const i of JOINTS) {
    const p = st.pts[i], l = lms?.[i];
    const fresh = p && now - p.seen < HOLD + FADE;
    if (l && (l.visibility ?? 1) >= (p?.on ? KEEP : SHOW)) {
      st.pts[i] = fresh
        ? { x: p.x + (l.x - p.x) * SMOOTH, y: p.y + (l.y - p.y) * SMOOTH, seen: now, on: true }
        : { x: l.x, y: l.y, seen: now, on: true };
    } else if (p) {
      p.on = false;
      if (shift) { p.x += shift.x; p.y += shift.y; }
    }
  }
}

const alphaOf = (st, now, ...ids) => Math.min(...ids.map(i => {
  const p = st.pts[i];
  return p ? Math.max(0, Math.min(1, 1 - (now - p.seen - HOLD) / FADE)) : 0;
}));

const CYAN = '#00e5ff', AMBER = '#ffb84d', DIM = '#7c83ff', PINK = '#ff4df0';
// Matched limbs glow cyan, close ones amber, the rest a dim violet.
const holoColor = s => (s == null || s >= 0.75 ? CYAN : s >= 0.4 ? AMBER : DIM);

// Dark backdrop with a perspective grid and scan lines, cached per canvas size.
function backdrop(state, w, h) {
  if (state.bg?.w === w && state.bg?.h === h) return state.bg.canvas;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#05061a'); grad.addColorStop(1, '#130b33');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  const hz = h * 0.72;
  g.strokeStyle = 'rgba(0,229,255,0.22)'; g.lineWidth = 1;
  for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(w / 2 + i * w * 0.02, hz); g.lineTo(w / 2 + i * w * 0.18, h); g.stroke(); }
  for (let i = 0; i < 9; i++) { const y = hz + (h - hz) * Math.pow(i / 8, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = 'rgba(0,229,255,0.06)';
  for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
  state.bg = { w, h, canvas: c };
  return c;
}

// state: from createAvatar(), one per canvas. lms: mirrored MediaPipe landmarks (0..1) or null.
// target: the dance buddy's pose (segment angles); when given, a dashed guide shows where each scored limb should point.
export function drawAvatar(ctx, w, h, lms, segScores, state, { target = null, now = performance.now() } = {}) {
  ctx.drawImage(backdrop(state, w, h), 0, 0, w, h);
  update(state, lms, now);

  const P = i => (state.pts[i] ? { x: state.pts[i].x * w, y: state.pts[i].y * h } : { x: 0, y: 0 });
  const mid = (a, b) => ({ x: (P(a).x + P(b).x) / 2, y: (P(a).y + P(b).y) / 2 });
  const A = (...ids) => alphaOf(state, now, ...ids);
  if (A(11, 12) > 0) state.sh = Math.max(20, Math.hypot(P(11).x - P(12).x, P(11).y - P(12).y));
  const sh = state.sh ?? Math.min(w, h) * 0.18;
  const line = (p, q, lw, color) => {
    ctx.lineWidth = lw; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  };
  const neon = (p, q, color, a, k = 1) => {
    if (a <= 0.02) return;
    ctx.globalAlpha = a * 0.3; line(p, q, sh * 0.22 * k, color);
    ctx.globalAlpha = a; line(p, q, sh * 0.08 * k, color); line(p, q, sh * 0.028 * k, '#ffffff');
  };
  const ring = (c, r, fill, stroke, lw, a) => {
    if (a <= 0.02) return;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };

  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const neck = mid(11, 12), hips = mid(23, 24), ta = A(11, 12, 23, 24);
  if (ta > 0.02) {
    const c = holoColor(segScores.torso);
    ctx.globalAlpha = ta;
    ctx.beginPath();
    for (const i of [11, 12, 24, 23]) ctx.lineTo(P(i).x, P(i).y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,229,255,0.12)'; ctx.fill();
    ctx.globalAlpha = ta * 0.3; ctx.lineWidth = sh * 0.16; ctx.strokeStyle = c; ctx.stroke();
    ctx.globalAlpha = ta; ctx.lineWidth = sh * 0.05; ctx.stroke();
    line(neck, hips, sh * 0.02, 'rgba(255,255,255,0.7)');
    ring({ x: (neck.x * 2 + hips.x) / 3, y: (neck.y * 2 + hips.y) / 3 }, sh * 0.11, null, PINK, sh * 0.04, ta);
  }
  for (const [key, [a, b]] of Object.entries(SEGMENTS)) {
    if (key !== 'torso') neon(P(a), P(b), holoColor(segScores[key]), A(a, b));
  }
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) ring(P(i), sh * 0.07, '#ffffff', PINK, sh * 0.03, A(i));

  const ha = A(0, 11, 12);
  if (ha > 0.02) {
    const nose = P(0), r = sh * 0.4;
    const up = { x: nose.x - neck.x, y: nose.y - neck.y }, len = Math.hypot(up.x, up.y) || 1, u = { x: up.x / len, y: up.y / len };
    const d = Math.max(len, r + sh * 0.26), head = { x: neck.x + u.x * d, y: neck.y + u.y * d };
    neon(neck, { x: head.x - u.x * r, y: head.y - u.y * r }, CYAN, ha, 0.6);
    ctx.save();
    ctx.translate(head.x, head.y); ctx.rotate(Math.atan2(u.x, -u.y));
    ctx.globalAlpha = ha; ctx.shadowColor = PINK; ctx.shadowBlur = sh * 0.4;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,229,255,0.12)'; ctx.fill(); ctx.lineWidth = sh * 0.05; ctx.strokeStyle = CYAN; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-r * 0.7, -r * 0.22, r * 1.4, r * 0.32, r * 0.16); ctx.fillStyle = PINK; ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-r * 0.5, -r * 0.1, r, r * 0.06);
    ctx.restore();
  }

  // Matching guides: from each scored limb's start joint, a dashed line in the buddy's direction.
  // On a match it sits on top of the limb; a mismatch shows the gap to close.
  if (target) {
    for (const [key, [a, b]] of Object.entries(SEGMENTS)) {
      const sc = segScores[key], al = key !== 'torso' && sc != null ? A(a, b) : 0;
      if (al <= 0.02) continue;
      const p = P(a), q = P(b), len = Math.hypot(q.x - p.x, q.y - p.y), rad = (target[key] * Math.PI) / 180;
      const end = { x: p.x + Math.sin(rad) * len, y: p.y + Math.cos(rad) * len };
      const miss = sc < 0.75;
      ctx.globalAlpha = al * (miss ? 0.95 : 0.45);
      ctx.setLineDash([sh * 0.08, sh * 0.08]);
      line(p, end, sh * (miss ? 0.045 : 0.03), '#ffffff');
      ctx.setLineDash([]);
      if (miss) ring(end, sh * 0.12, null, AMBER, sh * 0.045, al);
    }
  }
  ctx.restore();
}
