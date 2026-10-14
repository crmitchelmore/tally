const {spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
for (const [resolved,expected,ok] of [['https://test.convex.cloud','https://test.convex.cloud/',true],['https://other.convex.cloud','https://test.convex.cloud',false],['','https://test.convex.cloud',false],['http://test.convex.cloud','http://test.convex.cloud',false],['https://test.convex.cloud/?secret=x','https://test.convex.cloud',false]]) {
 const r=spawnSync(process.execPath,[require.resolve('./verify-convex-target.cjs')],{env:{...process.env,TALLY_RESOLVED_CONVEX_URL:resolved,NEXT_PUBLIC_CONVEX_URL:expected},encoding:'utf8'});
 assert.equal(r.status===0,ok);assert.ok(!r.stdout.includes('secret=x'));assert.ok(!r.stderr.includes('secret=x'));
}
console.log('5 deployment target guard cases passed');
