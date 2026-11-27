// Cartoon dancer drawn from segment angles (forward kinematics), on a 2D canvas.

export const CHARACTERS = {
  sunny: { name: 'Sunny', kind: 'star', head: '#ffd93d', body: '#ff9f43', limb: '#ffb86b', shoe: '#ee5253', outline: '#7a4a12' },
  bolt: { name: 'Bolt', kind: 'robot', head: '#c8d6e5', body: '#54a0ff', limb: '#8395a7', shoe: '#222f3e', outline: '#1e2a3a' },
  mimi: { name: 'Mimi', kind: 'kitty', head: '#ffb8d1', body: '#a55eea', limb: '#ffb8d1', shoe: '#5f27cd', outline: '#5a2148' },
  // Teen buddies: smaller heads (older proportions), hair, no rosy cheeks.
  nova: { name: 'Nova', kind: 'headphones', head: '#f1c27d', hair: '#3b2a26', accent: '#ff6b9a', body: '#6c5ce7', limb: '#34495e', shoe: '#f5f6fa', outline: '#1e1b2e', headScale: 0.78 },
  jay: { name: 'Jay', kind: 'cap', head: '#c68642', hair: '#2d2018', accent: '#1dd1a1', body: '#ff7f50', limb: '#576574', shoe: '#ee5253', outline: '#2b1d12', headScale: 0.78 },
};
const TEEN = new Set(['headphones', 'cap']);

const dir = a => {
  const r = (a * Math.PI) / 180;
  return { x: Math.sin(r), y: Math.cos(r) };
};
const add = (p, d, len) => ({ x: p.x + d.x * len, y: p.y + d.y * len });

export function skeleton(pose, H, headScale = 1) {
  const P = { torso: 0.23 * H, sw: 0.115 * H, hw: 0.07 * H, ua: 0.145 * H, fa: 0.135 * H, th: 0.15 * H, sh: 0.14 * H, neck: 0.03 * H, head: 0.16 * H * headScale };
  const hip = { x: 0, y: 0 };
  const up = dir(pose.torso + 180);
  const perp = { x: -up.y, y: up.x };
  const neckBase = add(hip, up, P.torso);
  const sL = add(neckBase, perp, -P.sw), sR = add(neckBase, perp, P.sw);
  const hL = add(hip, perp, -P.hw), hR = add(hip, perp, P.hw);
  const j = {
    hip, neckBase, sL, sR, hL, hR,
    eL: add(sL, dir(pose.uaL), P.ua), eR: add(sR, dir(pose.uaR), P.ua),
    kL: add(hL, dir(pose.thL), P.th), kR: add(hR, dir(pose.thR), P.th),
    headC: add(neckBase, up, P.neck + P.head),
  };
  j.wL = add(j.eL, dir(pose.faL), P.fa); j.wR = add(j.eR, dir(pose.faR), P.fa);
  j.aL = add(j.kL, dir(pose.shL), P.sh); j.aR = add(j.kR, dir(pose.shR), P.sh);
  return { j, P, up };
}

function line(ctx, a, b, w, color) {
  ctx.lineWidth = w; ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}
function circle(ctx, c, r, fill, stroke, sw = 3) {
  ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function limb(ctx, pts, w, color, outline, glow) {
  if (glow) { ctx.save(); ctx.shadowColor = '#2ecc71'; ctx.shadowBlur = w * 1.2; }
  for (let i = 0; i < pts.length - 1; i++) line(ctx, pts[i], pts[i + 1], w + 5, glow ? '#2ecc71' : outline);
  if (glow) ctx.restore();
  for (let i = 0; i < pts.length - 1; i++) line(ctx, pts[i], pts[i + 1], w, color);
}

function drawHead(ctx, c, r, ch, up, mood, t) {
  const ang = Math.atan2(up.x, -up.y);
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang);
  const o = ch.outline;
  if (ch.kind === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 1.05 : r * 1.55;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = '#ffc312'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
    circle(ctx, { x: 0, y: 0 }, r, ch.head, o);
  } else if (ch.kind === 'robot') {
    line(ctx, { x: 0, y: -r }, { x: 0, y: -r * 1.45 }, 4, o);
    circle(ctx, { x: 0, y: -r * 1.5 }, r * 0.16, Math.sin(t / 150) > 0 ? '#ff6b6b' : '#feca57', o, 2);
    ctx.beginPath(); ctx.roundRect(-r, -r * 0.95, r * 2, r * 1.9, r * 0.35);
    ctx.fillStyle = ch.head; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-r * 0.78, -r * 0.55, r * 1.56, r * 0.6, r * 0.25);
    ctx.fillStyle = '#222f3e'; ctx.fill();
  } else if (TEEN.has(ch.kind)) {
    if (ch.kind === 'headphones') {
      ctx.lineWidth = r * 0.2; ctx.strokeStyle = o;
      ctx.beginPath(); ctx.arc(0, -r * 0.05, r * 1.14, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.lineWidth = r * 0.12; ctx.strokeStyle = ch.accent;
      ctx.beginPath(); ctx.arc(0, -r * 0.05, r * 1.14, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    }
    circle(ctx, { x: 0, y: 0 }, r, ch.head, o);
    if (ch.kind === 'cap') {
      for (const s of [-1, 1]) circle(ctx, { x: s * r * 0.84, y: -r * 0.1 }, r * 0.2, ch.hair);
      ctx.beginPath(); ctx.arc(0, -r * 0.3, r * 0.98, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = ch.accent; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(-r * 0.15, -r * 0.42, r * 1.55, r * 0.18, r * 0.09);
      ctx.fillStyle = ch.accent; ctx.fill(); ctx.stroke();
      circle(ctx, { x: 0, y: -r * 1.3 }, r * 0.1, ch.accent, o, 2);
    } else {
      // Hair with a side-swept fringe that stays above the eyes.
      const a0 = Math.PI * 1.06, a1 = Math.PI * 1.94;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.02, a0, a1);
      ctx.quadraticCurveTo(r * 0.45, -r * 0.2, r * 0.05, -r * 0.5);
      ctx.quadraticCurveTo(-r * 0.5, -r * 0.32, Math.cos(a0) * r * 1.02, Math.sin(a0) * r * 1.02);
      ctx.closePath(); ctx.fillStyle = ch.hair; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.roundRect(s * r * 1.08 - r * 0.17, -r * 0.32, r * 0.34, r * 0.62, r * 0.14);
        ctx.fillStyle = ch.accent; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
      }
    }
  } else {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * r * 0.85, -r * 0.35); ctx.lineTo(s * r * 0.75, -r * 1.35); ctx.lineTo(s * r * 0.2, -r * 0.9); ctx.closePath();
      ctx.fillStyle = ch.head; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
    }
    circle(ctx, { x: 0, y: 0 }, r, ch.head, o);
  }

  const blink = t % 3600 < 130;
  const eyeY = ch.kind === 'robot' ? -r * 0.25 : -r * 0.15, eyeX = r * 0.38;
  const eyeColor = ch.kind === 'robot' ? '#48dbfb' : '#2d3436';
  for (const s of [-1, 1]) {
    if (blink) line(ctx, { x: s * eyeX - r * 0.12, y: eyeY }, { x: s * eyeX + r * 0.12, y: eyeY }, 3, eyeColor);
    else {
      circle(ctx, { x: s * eyeX, y: eyeY }, r * 0.13, eyeColor);
      if (ch.kind !== 'robot') circle(ctx, { x: s * eyeX + r * 0.04, y: eyeY - r * 0.05 }, r * 0.045, '#fff');
    }
  }
  if (ch.kind !== 'robot' && !TEEN.has(ch.kind)) for (const s of [-1, 1]) circle(ctx, { x: s * r * 0.62, y: r * 0.22 }, r * 0.13, 'rgba(255,107,129,0.45)');
  if (ch.kind === 'kitty') for (const s of [-1, 1]) for (const dy of [0.12, 0.3]) line(ctx, { x: s * r * 0.55, y: r * dy }, { x: s * r * 1.15, y: r * (dy * 1.6 - 0.1) }, 1.5, o);

  ctx.lineWidth = 3; ctx.strokeStyle = ch.kind === 'robot' ? '#222f3e' : '#2d3436'; ctx.lineCap = 'round';
  ctx.beginPath();
  const mouthY = ch.kind === 'robot' ? r * 0.45 : r * 0.28;
  if (mood === 'cheer') {
    ctx.arc(0, mouthY - r * 0.05, r * 0.3, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#c0392b'; ctx.fill(); ctx.stroke();
  } else { ctx.arc(0, mouthY - r * 0.12, r * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.restore();
}

// opts: { cx, groundY, height, character, beat, ghost, mood, glow: {seg: score} }
export function drawDancer(ctx, pose, opts) {
  const { cx, groundY, height: H, beat = 0, ghost = false, mood = 'happy', glow = {} } = opts;
  const ch = CHARACTERS[opts.character] || CHARACTERS.sunny;
  const { j, P, up } = skeleton(pose, H, ch.headScale);
  const footR = 0.042 * H;
  const lowest = Math.max(j.aL.y, j.aR.y, j.hip.y) + footR;
  const bounce = ghost ? 0 : -Math.abs(Math.sin(beat * Math.PI)) * 0.012 * H;
  const t = performance.now();

  ctx.save();
  ctx.translate(cx, groundY - lowest + bounce);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (ghost) {
    ctx.globalAlpha = 0.16;
    const g = '#576574', w = 0.06 * H;
    for (const pts of [[j.hL, j.kL, j.aL], [j.hR, j.kR, j.aR], [j.sL, j.eL, j.wL], [j.sR, j.eR, j.wR]]) limb(ctx, pts, w, g, g);
    line(ctx, j.hip, j.neckBase, 0.17 * H, g);
    circle(ctx, j.headC, P.head, g);
    ctx.restore();
    return;
  }

  const shadowW = 0.16 * H;
  ctx.save(); ctx.globalAlpha = 0.15; ctx.beginPath();
  ctx.ellipse(0, lowest - bounce, shadowW, shadowW * 0.18, 0, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();

  const lw = 0.075 * H, o = ch.outline;
  const glowOn = (...keys) => keys.every(k => glow[k] != null && glow[k] >= 0.85);
  limb(ctx, [j.hL, j.kL, j.aL], lw, ch.limb, o, glowOn('thL', 'shL'));
  limb(ctx, [j.hR, j.kR, j.aR], lw, ch.limb, o, glowOn('thR', 'shR'));
  for (const a of [j.aL, j.aR]) {
    ctx.beginPath(); ctx.ellipse(a.x, a.y, footR * 1.4, footR, 0, 0, Math.PI * 2);
    ctx.fillStyle = ch.shoe; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = o; ctx.stroke();
  }

  const tb = add(j.hip, up, 0.07 * H), tt = add(j.neckBase, up, -0.05 * H);
  line(ctx, tb, tt, 0.22 * H + 5, o);
  line(ctx, tb, tt, 0.22 * H, ch.body);
  ctx.save(); ctx.globalAlpha = 0.25;
  circle(ctx, add(j.hip, up, P.torso * 0.55), 0.035 * H, '#fff');
  ctx.restore();

  // Raised arms are drawn in front of the (big) head so they stay visible.
  const arms = [[j.sL, j.eL, j.wL, glowOn('uaL', 'faL')], [j.sR, j.eR, j.wR, glowOn('uaR', 'faR')]];
  const drawArm = ([s, e, w, g]) => { limb(ctx, [s, e, w], lw, ch.limb, o, g); circle(ctx, w, 0.048 * H, ch.head, o); };
  const raised = ([, , w]) => w.y < j.neckBase.y - 0.05 * H;
  arms.filter(a => !raised(a)).forEach(drawArm);
  drawHead(ctx, j.headC, P.head, ch, up, mood, t);
  arms.filter(raised).forEach(drawArm);
  ctx.restore();
}
