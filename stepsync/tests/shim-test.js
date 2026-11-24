// Minimal browser stand-in for `node:test`.
const tests = [];
export const test = (name, fn) => tests.push({ name, fn });
export async function run() {
  const results = [];
  for (const t of tests) {
    try { await t.fn(); results.push({ name: t.name, ok: true }); }
    catch (e) { results.push({ name: t.name, ok: false, error: e.message }); }
  }
  return results;
}
