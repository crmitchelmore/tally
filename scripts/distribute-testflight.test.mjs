import test from 'node:test';
import assert from 'node:assert/strict';
import { configureTestFlight } from './distribute-testflight.mjs';

function scenario({ internal = true, attached = true, failure, paginated = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method });
    const path = new URL(url).pathname;
    if (failure && path.endsWith(failure.path)) {
      return { ok: false, status: failure.status, text: async () => 'Apple rejected the request' };
    }
    let data;
    let links;
    if (path.endsWith('/betaGroups/group')) data = { attributes: { isInternalGroup: internal } };
    else if (path.endsWith('/relationships/builds')) {
      const secondPage = url.includes('cursor=next');
      data = attached && (!paginated || secondPage) ? [{ id: 'build' }] : [];
      if (paginated && !secondPage) links = { next: `${url}&cursor=next` };
    } else data = { id: 'review' };
    return { ok: true, status: 200, json: async () => ({ data, links }) };
  };
  return { calls, run: () => configureTestFlight({ token: 'test', buildId: 'build', groupIds: ['group'], fetchImpl }) };
}

test('existing internal access succeeds without external group mutation or beta review', async () => {
  const { calls, run } = scenario();
  assert.deepEqual(await run(), { groups: 1, betaReview: 'not-required' });
  assert.ok(calls.every(call => call.method === 'GET'));
});
test('internal build lookup follows pagination', async () => {
  const { calls, run } = scenario({ paginated: true });
  await run();
  assert.ok(calls.some(call => call.url.includes('cursor=next')));
});
test('missing internal access fails instead of claiming distribution', async () => {
  await assert.rejects(scenario({ attached: false }).run, /does not contain this build/);
});
test('external access is attached before requesting beta review', async () => {
  const { calls, run } = scenario({ internal: false, attached: false });
  assert.equal((await run()).betaReview, 'submitted');
  assert.deepEqual(calls.filter(call => call.method === 'POST').map(call => new URL(call.url).pathname), [
    '/v1/builds/build/relationships/betaGroups', '/v1/betaAppReviewSubmissions',
  ]);
});
test('a rejected group attachment fails the release step', async () => {
  await assert.rejects(scenario({ internal: false, attached: false, failure: { path: '/relationships/betaGroups', status: 400 } }).run, /400/);
});
test('409 beta review errors are not reported as success', async () => {
  await assert.rejects(scenario({ internal: false, failure: { path: '/betaAppReviewSubmissions', status: 409 } }).run, /409/);
});
test('missing group configuration fails explicitly', async () => {
  await assert.rejects(configureTestFlight({ token: 'test', buildId: 'build', groupIds: [] }), /No TestFlight groups/);
});
