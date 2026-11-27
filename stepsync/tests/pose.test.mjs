import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromLandmarks, mirror, compare, segmentScore, judge, stars, buildRoutine, poseAt, moveIndexAt, wrap } from '../js/pose.js';
import { POSES, ROUTINES } from '../js/routines.js';
import { CHARACTERS, skeleton } from '../js/dancer.js';

// Build 33 landmarks for a person (unmirrored camera coords) from screen-space points after mirroring.
function person({ armsAngle = 0 } = {}) {
  const lms = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  const set = (i, x, y) => (lms[i] = { x: 1 - x, y, visibility: 1 }); // store unmirrored
  const r = (armsAngle * Math.PI) / 180, L = 0.1;
  set(11, 0.4, 0.3); set(12, 0.6, 0.3); set(23, 0.45, 0.6); set(24, 0.55, 0.6);
  set(13, 0.4 - Math.sin(r) * L, 0.3 + Math.cos(r) * L); set(15, 0.4 - Math.sin(r) * 2 * L, 0.3 + Math.cos(r) * 2 * L);
  set(14, 0.6 + Math.sin(r) * L, 0.3 + Math.cos(r) * L); set(16, 0.6 + Math.sin(r) * 2 * L, 0.3 + Math.cos(r) * 2 * L);
  set(25, 0.45, 0.75); set(27, 0.45, 0.9); set(26, 0.55, 0.75); set(28, 0.55, 0.9);
  return mirror(lms);
}

const close = (a, b, eps = 1) => assert.ok(Math.abs(wrap(a - b)) < eps, `${a} != ${b}`);

test('arms down, T-pose and arms up angles (screen-space, mirrored)', () => {
  let p = fromLandmarks(person({ armsAngle: 0 }), 1);
  close(p.uaL.angle, 0); close(p.uaR.angle, 0); close(p.torso.angle, 0); close(p.thL.angle, 0);
  p = fromLandmarks(person({ armsAngle: 90 }), 1);
  close(p.uaL.angle, -90); close(p.uaR.angle, 90);
  p = fromLandmarks(person({ armsAngle: 180 }), 1);
  close(Math.abs(p.uaL.angle), 180); close(Math.abs(p.faR.angle), 180);
});

test('mirroring puts the left shoulder (11) on screen-left', () => {
  const lms = mirror(Array.from({ length: 33 }, (_, i) => ({ x: i === 11 ? 0.7 : 0.3, y: 0.5 })));
  assert.ok(lms[11].x < 0.5);
});

test('segment score thresholds', () => {
  assert.equal(segmentScore(10), 1);
  assert.equal(segmentScore(-15), 1);
  assert.equal(segmentScore(30), 0.5);
  assert.equal(segmentScore(50), 0);
  assert.equal(segmentScore(50, true), 1 - 30 / 35);
});

test('compare: matching T-pose scores high, arms down scores low', () => {
  const target = { ...POSES.rest, ...POSES.tPose, uaL: -90, faL: -90, uaR: 90, faR: 90 };
  const good = compare(fromLandmarks(person({ armsAngle: 90 }), 1), target);
  const bad = compare(fromLandmarks(person({ armsAngle: 0 }), 1), target);
  assert.ok(good.overall > 0.9, `good ${good.overall}`);
  assert.ok(bad.overall < 0.5, `bad ${bad.overall}`);
});

test('compare: invisible segments are ignored; too few -> null', () => {
  const lms = person().map(p => ({ ...p, visibility: 0.1 }));
  assert.equal(compare(fromLandmarks(lms, 1), POSES.rest).overall, null);
  const up = compare(fromLandmarks(person(), 1), POSES.rest, { upperOnly: true });
  assert.equal(up.segments.thL, null);
  assert.notEqual(up.overall, null);
});

test('judge and stars', () => {
  assert.equal(judge(0.9).label, 'Perfect!');
  assert.equal(judge(0.7).points, 2);
  assert.equal(judge(0.1).points, 0);
  assert.equal(stars(9, 10), 3);
  assert.equal(stars(5, 10), 2);
  assert.equal(stars(0, 10), 1);
});

test('routines build, inherit rest, and interpolate along the shortest arc', () => {
  for (const def of ROUTINES) {
    const r = buildRoutine(def, POSES);
    assert.ok(r.totalBeats > 0);
    for (const m of r.moves) assert.equal(Object.keys(m.pose).length, 9);
  }
  assert.throws(() => buildRoutine({ id: 'x', moves: [{ pose: 'nope', beats: 1 }] }, POSES));
  const r = buildRoutine({ id: 't', moves: [{ pose: 'a', beats: 2 }, { pose: 'b', beats: 2 }] },
    { rest: POSES.rest, a: { faR: 170 }, b: { faR: -170 } });
  const mid = poseAt(r, 2 + 0.6); // halfway through the ease
  assert.ok(Math.abs(mid.faR) > 170, `took long way round: ${mid.faR}`);
  close(poseAt(r, 3.5).faR, -170);
  close(poseAt(r, -1).uaL, POSES.rest.uaL);
});

test('characters: teen buddies have smaller heads; every character has a full palette', () => {
  for (const [id, c] of Object.entries(CHARACTERS)) {
    for (const k of ['name', 'kind', 'head', 'body', 'limb', 'shoe', 'outline']) assert.ok(c[k], `${id}.${k}`);
  }
  const kid = skeleton(POSES.rest, 100).P.head, teen = skeleton(POSES.rest, 100, CHARACTERS.nova.headScale).P.head;
  assert.ok(teen < kid);
});

test('keyframe (video) routines: repeat, interpolate and split into judged phrases', () => {
  const up = [180, -150, -155, 150, 155, -4, -2, 4, 2], down = [0, -10, -8, 10, 8, -4, -2, 4, 2];
  const def = { id: 'k', bpm: 60, keyBeats: 0.5, repeat: 2, phraseBeats: 1, keys: [down, down, up, up] };
  def.keys[2] = def.keys[3] = [0, -150, -155, 150, 155, -4, -2, 4, 2];
  const r = buildRoutine(def, POSES);
  assert.equal(r.keys.length, 8);
  assert.equal(r.totalBeats, 4);
  assert.equal(r.moves.length, 4);
  assert.deepEqual(r.moves.map(m => m.start), [0, 1, 2, 3]);
  assert.ok(r.moves.every(m => m.judge && m.label));
  close(poseAt(r, 0.75).uaR, 80); // halfway between key 1 (10) and key 2 (150)
  close(poseAt(r, 99).uaR, 150);
  assert.equal(moveIndexAt(r, 2.5), 2);
});

test('video dances are built and come with their own music', () => {
  for (const def of ROUTINES.filter(d => d.keys)) {
    const r = buildRoutine(def, POSES);
    assert.ok(r.music, `${def.id} has music`);
    assert.ok(r.keys.every(k => Object.keys(k).length === 9));
    assert.ok(r.moves.length > 5);
  }
});
