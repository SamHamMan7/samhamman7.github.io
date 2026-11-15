import assert from 'node:assert/strict';
import worker, { readHac } from './worker.js';
const call = (init, origin = 'https://samhamman7.github.io') => worker.fetch(new Request('https://w.example/', { ...init, headers: { Origin: origin, 'Content-Type': 'application/json' } }));
assert.equal((await call({ method: 'OPTIONS' })).status, 204);
assert.equal((await call({ method: 'POST', body: '{"user":"a","pass":"b"}' }, 'https://evil.example')).status, 403);
assert.equal((await call({ method: 'POST', body: '{}' })).status, 400);
assert.match(await (await call({ method: 'GET' })).text(), /version 2/);
if (process.argv.includes('--live')) { const r = await readHac('not-a-real-user-xyz', 'wrong-password'); console.log('live wrong login ->', r); assert.equal(r.status, 401); }
console.log('worker checks passed');
