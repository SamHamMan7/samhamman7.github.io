import assert from 'node:assert/strict';
import worker, { parseGrades, readGrades } from './worker.js';
const html = `<div class="AssignmentClass"><div class="sg-header"><a class="sg-header-heading" href="#">1234A - 2    AP Chemistry A</a><span id="plnMain_rptAssigmnetsByCourse_lblHdrAverage_0" class="sg-header-heading sg-right">Student Grades 93.47%</span></div><table></table></div>
<div class="AssignmentClass"><div class="sg-header"><a class="sg-header-heading">2210 - 5 AP Eng Lang &amp; Comp</a><span id="plnMain_rptAssigmnetsByCourse_lblHdrAverage_1">AVG 88.00</span></div></div>
<div class="AssignmentClass"><div class="sg-header"><a class="sg-header-heading">9000 - 1 Advisory</a><span id="plnMain_rptAssigmnetsByCourse_lblHdrAverage_2"></span></div></div>`;
assert.deepEqual(parseGrades(html), [{ name: 'AP Chemistry A', code: '1234A - 2', average: 93.47 }, { name: 'AP Eng Lang & Comp', code: '2210 - 5', average: 88 }, { name: 'Advisory', code: '9000 - 1', average: null }]);
const call = (init, origin = 'https://samhamman7.github.io') => worker.fetch(new Request('https://w.example/', { ...init, headers: { Origin: origin, 'Content-Type': 'application/json' } }));
assert.equal((await call({ method: 'OPTIONS' })).status, 204);
assert.equal((await call({ method: 'POST', body: '{"user":"a","pass":"b"}' }, 'https://evil.example')).status, 403);
assert.equal((await call({ method: 'POST', body: '{}' })).status, 400);
if (process.argv.includes('--live')) { const r = await readGrades('not-a-real-user-xyz', 'wrong-password'); console.log('live wrong login ->', r); assert.equal(r.status, 401); }
console.log('worker checks passed');
