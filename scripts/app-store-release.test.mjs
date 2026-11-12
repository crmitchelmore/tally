import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { releaseToAppStore, loadScreenshots } from './app-store-release.mjs';

const refData = {
  displayClasses: [
    { displayClassId: 'IPHONE_DYNAMIC_ISLAND_LARGE_DISPLAY', deviceFamily: 'IPHONE' },
    { displayClassId: 'IPHONE_FACE_ID_MEDIUM_DISPLAY', deviceFamily: 'IPHONE' },
    { displayClassId: 'IPAD_13_DISPLAY', deviceFamily: 'IPAD' },
  ],
  placementProfileGroups: [
    { placementProfileGroupId: 'IPHONE_LARGE', displayClassId: 'IPHONE_DYNAMIC_ISLAND_LARGE_DISPLAY' },
    { placementProfileGroupId: 'IPHONE_OLD', displayClassId: 'IPHONE_FACE_ID_MEDIUM_DISPLAY' },
    { placementProfileGroupId: 'IPAD_13', displayClassId: 'IPAD_13_DISPLAY' },
  ],
  placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [
    { placementGroupId: 'IPHONE_LARGE', specs: ['spec-6.9'] },
    { placementGroupId: 'IPHONE_OLD', specs: ['spec-6.1'] },
    { placementGroupId: 'IPAD_13', specs: ['spec-ipad'] },
  ] }],
};

function fakeApi({ versions = [{ id: 'v1', attributes: { versionString: '1.9.0', appVersionState: 'PREPARE_FOR_SUBMISSION' } }], builds = [{ id: 'b2', attributes: { version: '200' } }, { id: 'b1', attributes: { version: '100' } }], active = [], openSubmission, items = [], imageSpec = 'spec-6.9', placements = [] } = {}) {
  const calls = [];
  const record = (method, target, body) => { calls.push({ method, path: new URL(target, 'https://x').pathname, body }); };
  const api = {
    calls,
    mutations: () => calls.filter(c => c.method !== 'GET').map(c => `${c.method} ${c.path}`),
    async get(target) {
      record('GET', target);
      const { pathname, searchParams } = new URL(target, 'https://x');
      if (pathname === '/v1/builds') {
        const exact = searchParams.get('filter[version]');
        api.buildFilter = exact;
        return { data: exact ? builds.filter(b => b.attributes.version === exact) : builds };
      }
      if (pathname.endsWith('/appStoreVersions')) return { data: versions };
      if (pathname === '/v1/reviewSubmissions') {
        return { data: searchParams.get('filter[state]').includes('IN_REVIEW') ? active : (openSubmission ? [openSubmission] : []) };
      }
      if (pathname.endsWith('/appStoreVersionLocalizations')) return { data: [{ id: 'loc', attributes: { locale: 'en-GB' } }] };
      if (pathname.endsWith('/assetLibrary')) return { data: { id: 'lib' } };
      if (pathname === '/v1/appAssetLibraryRefData') return { data: [{ attributes: refData }] };
      if (pathname.endsWith('/placements')) return { data: placements };
      if (pathname.startsWith('/v1/appAssetLibraryImages/')) return { data: { id: 'img', attributes: { state: 'PREPARE_FOR_SUBMISSION', specId: imageSpec } } };
      if (pathname.endsWith('/items')) return { data: items };
      throw new Error(`unexpected GET ${pathname}`);
    },
    async post(target, body) {
      record('POST', target, body);
      if (target === '/v1/appAssetLibraryImages') return { data: { id: 'img', attributes: { uploadOperations: [{ method: 'PUT', url: 'https://upload', offset: 0, length: 3 }] } } };
      if (target === '/v1/appAssetLibraryPlacements') return { data: { id: 'new-placement' } };
      if (target === '/v1/appStoreVersions') return { data: { id: 'created', attributes: { versionString: '1.12.0' } } };
      return { data: { id: 'sub' } };
    },
    async patch(target, body) { record('PATCH', target, body); return { data: {} }; },
    async delete(target) { record('DELETE', target); return null; },
    async upload(operation) { record('PUT', operation.url); },
  };
  return api;
}
const run = (api, options = {}) => releaseToAppStore(api, { appId: 'app', version: '1.12.0', log: () => {}, sleep: async () => {}, ...options });

test('stale draft is renamed, gets the latest build and is submitted for review', async () => {
  const api = fakeApi();
  assert.equal((await run(api)).status, 'submitted');
  assert.deepEqual(api.mutations(), [
    'PATCH /v1/appStoreVersions/v1',
    'PATCH /v1/appStoreVersions/v1/relationships/build',
    'POST /v1/reviewSubmissions',
    'POST /v1/reviewSubmissionItems',
    'PATCH /v1/reviewSubmissions/sub',
  ]);
  assert.equal(api.calls.find(c => c.path.endsWith('/relationships/build')).body.data.id, 'b2');
  assert.equal(api.calls.at(-1).body.data.attributes.submitted, true);
});

test('an exact build number is honoured and a missing one fails', async () => {
  const api = fakeApi();
  assert.equal((await run(api, { buildNumber: '100' })).buildId, 'b1');
  await assert.rejects(run(fakeApi(), { buildNumber: '999' }), /No processed build 999/);
});

test('a version already in review is left alone', async () => {
  const api = fakeApi({ versions: [{ id: 'v1', attributes: { versionString: '1.11.0', appVersionState: 'WAITING_FOR_REVIEW' } }] });
  assert.equal((await run(api)).status, 'already-in-review');
  assert.deepEqual(api.mutations(), []);
});

test('an active review submission blocks renaming the draft', async () => {
  const api = fakeApi({ active: [{ id: 'busy' }] });
  assert.equal((await run(api)).status, 'already-in-review');
  assert.deepEqual(api.mutations(), []);
});

test('dry run reports without mutating', async () => {
  const api = fakeApi();
  assert.equal((await run(api, { dryRun: true })).status, 'dry-run');
  assert.deepEqual(api.mutations(), []);
});

test('release notes are only set once the app has a public release', async () => {
  const first = fakeApi();
  await run(first, { whatsNew: 'Fixes' });
  assert.ok(!first.mutations().includes('PATCH /v1/appStoreVersionLocalizations/loc'));

  const later = fakeApi({ versions: [
    { id: 'v0', attributes: { versionString: '1.11.0', appVersionState: 'READY_FOR_DISTRIBUTION' } },
    { id: 'v1', attributes: { versionString: '1.12.0', appVersionState: 'PREPARE_FOR_SUBMISSION' } },
  ] });
  await run(later, { whatsNew: 'Fixes' });
  assert.ok(later.mutations().includes('PATCH /v1/appStoreVersionLocalizations/loc'));
});

test('a new version is created when nothing is editable', async () => {
  const api = fakeApi({ versions: [{ id: 'v0', attributes: { versionString: '1.11.0', appVersionState: 'READY_FOR_DISTRIBUTION' } }] });
  await run(api);
  assert.equal(api.mutations()[0], 'POST /v1/appStoreVersions');
  assert.equal(api.mutations()[1], 'PATCH /v1/appStoreVersions/created/relationships/build');
});

test('rejected submissions are reused rather than duplicated', async () => {
  const api = fakeApi({ openSubmission: { id: 'rejected' } });
  await run(api);
  assert.ok(!api.mutations().includes('POST /v1/reviewSubmissions'));
  assert.ok(api.mutations().includes('PATCH /v1/reviewSubmissions/rejected'));
});

async function iphoneScreenshots() {
  const dir = await mkdtemp(path.join(tmpdir(), 'shots-'));
  await mkdir(path.join(dir, 'iphone'));
  await writeFile(path.join(dir, 'iphone', '01-progress.jpg'), 'abc');
  return loadScreenshots(dir);
}

test('screenshots go through the asset library and replace every stale iPhone placement', async () => {
  const screenshots = await iphoneScreenshots();
  assert.deepEqual(Object.keys(screenshots), ['IPHONE']);

  const api = fakeApi({ placements: [
    { id: 'old-large', attributes: { placementGroup: 'IPHONE_LARGE' } },
    { id: 'old-small', attributes: { placementGroup: 'IPHONE_OLD' } },
    { id: 'ipad', attributes: { placementGroup: 'IPAD_13' } },
  ] });
  await run(api, { screenshots });
  const mutations = api.mutations();
  const order = ['POST /v1/appAssetLibraryImages', 'PUT /', 'PATCH /v1/appAssetLibraryImages/img', 'DELETE /v1/appAssetLibraryPlacements/old-large',
    'POST /v1/appAssetLibraryPlacements', 'POST /v1/appAssetLibraryPlacementOrderingRequests', 'POST /v1/reviewSubmissions'];
  assert.deepEqual(order.map(m => mutations.indexOf(m)).every((i, n, all) => i >= 0 && (n === 0 || i > all[n - 1])), true);
  assert.ok(mutations.includes('DELETE /v1/appAssetLibraryPlacements/old-small'));
  assert.ok(!mutations.includes('DELETE /v1/appAssetLibraryPlacements/ipad'));
  assert.ok(!mutations.some(m => m.includes('appScreenshot')));
  assert.deepEqual(api.calls.find(c => c.path === '/v1/appAssetLibraryImages/img' && c.method === 'PATCH').body.data.attributes, { uploaded: true });
  assert.equal(api.calls.find(c => c.path === '/v1/appAssetLibraryPlacements' && c.method === 'POST').body.data.attributes.placementGroup, 'IPHONE_LARGE');
});

test('a screenshot matching no screenshot group for its device stops before placements change', async () => {
  const api = fakeApi({ imageSpec: 'spec-ipad', placements: [{ id: 'old-large', attributes: { placementGroup: 'IPHONE_LARGE' } }] });
  await assert.rejects(run(api, { screenshots: await iphoneScreenshots() }), /no IPHONE App Store screenshot group/);
  assert.ok(!api.mutations().some(m => m.includes('Placement')));
});

test('a rejected item is marked resolved before resubmitting', async () => {
  const api = fakeApi({
    openSubmission: { id: 'rejected' },
    items: [{ id: 'item', attributes: { state: 'REJECTED' }, relationships: { appStoreVersion: { data: { id: 'v1' } } } }],
  });
  await run(api);
  const mutations = api.mutations();
  assert.ok(!mutations.includes('POST /v1/reviewSubmissionItems'));
  assert.ok(mutations.indexOf('PATCH /v1/reviewSubmissionItems/item') < mutations.indexOf('PATCH /v1/reviewSubmissions/rejected'));
  assert.equal(api.calls.find(c => c.path === '/v1/reviewSubmissionItems/item').body.data.attributes.resolved, true);
});

test('a submission with unresolved issues for other items stops before any change', async () => {
  const api = fakeApi({
    openSubmission: { id: 'stuck', attributes: { state: 'UNRESOLVED_ISSUES' } },
    items: [{ id: 'cpp', attributes: { state: 'REJECTED' }, relationships: { appStoreVersion: { data: null } } }],
  });
  await assert.rejects(run(api), /unresolved issues/);
  assert.deepEqual(api.mutations(), []);
});

test('an exact build number is looked up server-side', async () => {
  const api = fakeApi();
  await run(api, { buildNumber: '100' });
  assert.equal(api.buildFilter, '100');
});
