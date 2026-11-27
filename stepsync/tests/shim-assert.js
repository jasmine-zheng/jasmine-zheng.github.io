// Minimal browser stand-in for `node:assert/strict`.
const fail = msg => { throw new Error(msg); };
const assert = {
  ok: (v, msg) => v || fail(msg || `expected truthy, got ${v}`),
  equal: (a, b, msg) => Object.is(a, b) || fail(msg || `${a} !== ${b}`),
  notEqual: (a, b, msg) => !Object.is(a, b) || fail(msg || `${a} === ${b}`),
  deepEqual: (a, b, msg) => JSON.stringify(a) === JSON.stringify(b) || fail(msg || `${JSON.stringify(a)} !== ${JSON.stringify(b)}`),
  throws: (fn, msg) => {
    try { fn(); } catch { return; }
    fail(msg || 'expected function to throw');
  },
};
export default assert;
