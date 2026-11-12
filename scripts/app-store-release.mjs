// Moves a processed TestFlight build into App Store review. TestFlight distribution
// alone never publishes the app; this attaches the build to an editable App Store
// version, refreshes screenshots and submits it for App Review.
import crypto from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://api.appstoreconnect.apple.com';
const EDITABLE = new Set(['PREPARE_FOR_SUBMISSION', 'READY_FOR_REVIEW', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY']);
const IN_FLIGHT = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW', 'WAITING_FOR_EXPORT_COMPLIANCE', 'PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'ACCEPTED', 'PROCESSING_FOR_DISTRIBUTION', 'PROCESSING_FOR_APP_STORE', 'PENDING_CONTRACT']);
const RELEASED = new Set(['PREORDER_READY_FOR_SALE', 'READY_FOR_SALE', 'READY_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_VERSION', 'REMOVED_FROM_SALE', 'DEVELOPER_REMOVED_FROM_SALE']);
const OPEN_SUBMISSION = ['READY_FOR_REVIEW', 'UNRESOLVED_ISSUES'];
const ACTIVE_SUBMISSION = ['WAITING_FOR_REVIEW', 'IN_REVIEW'];
export const DEVICE_FAMILIES = { iphone: 'IPHONE', ipad: 'IPAD' };

const versionState = version => version.attributes.appVersionState ?? version.attributes.appStoreState;

export function makeJWT({ keyId, issuerId, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const input = `${encode({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${encode({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })}`;
  const signature = crypto.sign('sha256', Buffer.from(input), { key: crypto.createPrivateKey(privateKey), dsaEncoding: 'ieee-p1363' });
  return `${input}.${signature.toString('base64url')}`;
}

export function ascClient({ token, fetchImpl = fetch }) {
  const getToken = typeof token === 'function' ? token : () => token;
  async function request(method, target, body) {
    const url = new URL(target, ORIGIN);
    if (url.origin !== ORIGIN) throw new Error('Unexpected App Store Connect origin');
    const response = await fetchImpl(url.href, {
      method,
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`App Store Connect ${method} ${url.pathname} ${response.status}: ${await response.text()}`);
    return response.status === 204 ? null : response.json();
  }
  return {
    get: target => request('GET', target),
    post: (target, body) => request('POST', target, body),
    patch: (target, body) => request('PATCH', target, body),
    delete: target => request('DELETE', target),
    async upload(operation, bytes) {
      const headers = Object.fromEntries((operation.requestHeaders ?? []).map(h => [h.name, h.value]));
      const chunk = bytes.subarray(operation.offset, operation.offset + operation.length);
      const response = await fetchImpl(operation.url, { method: operation.method, headers, body: chunk });
      if (!response.ok) throw new Error(`Screenshot upload ${response.status}: ${await response.text()}`);
    },
  };
}

export async function findBuild(api, { appId, version, buildNumber }) {
  const query = new URLSearchParams({
    'filter[app]': appId, 'filter[preReleaseVersion.platform]': 'IOS', 'filter[preReleaseVersion.version]': version,
    'filter[processingState]': 'VALID', sort: '-uploadedDate', limit: '50',
  });
  // filter[version] is the build number (CFBundleVersion), so an exact build is found server-side.
  if (buildNumber) query.set('filter[version]', buildNumber);
  const builds = (await api.get(`/v1/builds?${query}`)).data;
  const build = buildNumber ? builds.find(b => (b.attributes.version ?? b.attributes.buildNumber) === buildNumber) : builds[0];
  if (!build) throw new Error(`No processed build ${buildNumber ?? '(latest)'} found for version ${version}`);
  if (build.attributes.expired) throw new Error(`Build ${build.attributes.version} has expired`);
  return build;
}

async function listAll(api, target) {
  const items = [];
  for (let next = target; next;) {
    const page = await api.get(next);
    items.push(...page.data);
    next = page.links?.next;
  }
  return items;
}

async function prepareVersion(api, { appId, version, dryRun, log }) {
  const versions = await listAll(api, `/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS&limit=50`);
  const inFlight = versions.find(v => IN_FLIGHT.has(versionState(v)));
  const editable = versions.find(v => EDITABLE.has(versionState(v)));
  const hasRelease = versions.some(v => RELEASED.has(versionState(v)));
  for (const v of versions) log(`App Store version ${v.attributes.versionString}: ${versionState(v)}`);
  if (inFlight) return { inFlight, hasRelease };
  if (editable) {
    if (editable.attributes.versionString !== version) {
      log(`Renaming editable App Store version ${editable.attributes.versionString} → ${version}`);
      if (!dryRun) await api.patch(`/v1/appStoreVersions/${editable.id}`, { data: { type: 'appStoreVersions', id: editable.id, attributes: { versionString: version } } });
    }
    return { appStoreVersion: editable, hasRelease };
  }
  log(`Creating App Store version ${version}`);
  if (dryRun) return { appStoreVersion: null, hasRelease };
  const created = await api.post('/v1/appStoreVersions', { data: {
    type: 'appStoreVersions', attributes: { platform: 'IOS', versionString: version },
    relationships: { app: { data: { type: 'apps', id: appId } } },
  } });
  return { appStoreVersion: created.data, hasRelease };
}

const PENDING_ASSET = new Set(['AWAITING_UPLOAD', 'UPLOAD_COMPLETE']);

// Screenshots use the App Asset Library (the set-based appScreenshots API is deprecated):
// upload each file once, then place it on every localization.
async function uploadScreenshots(api, { appId, screenshots, log, sleep }) {
  const library = (await api.get(`/v1/apps/${appId}/assetLibrary`)).data;
  const ref = (await api.get('/v1/appAssetLibraryRefData')).data[0].attributes;
  const familyOfClass = new Map(ref.displayClasses.map(c => [c.displayClassId, c.deviceFamily]));
  const familyOfGroup = new Map(ref.placementProfileGroups.map(g => [g.placementProfileGroupId, familyOfClass.get(g.displayClassId)]));
  const mappings = ref.placementTypes.find(t => t.placementTypeId === 'APP_SCREENSHOT')?.specMappings ?? [];

  const uploads = [];
  for (const [family, files] of Object.entries(screenshots)) {
    for (const file of files) {
      const bytes = await readFile(file);
      const name = path.basename(file);
      const reserved = (await api.post('/v1/appAssetLibraryImages', { data: {
        type: 'appAssetLibraryImages',
        attributes: { fileName: name, fileSize: bytes.length, category: 'APP_SCREENSHOTS_AND_PREVIEWS', referenceName: `${family} ${name}` },
        relationships: { assetLibrary: { data: { type: 'appAssetLibraries', id: library.id } } },
      } })).data;
      for (const operation of reserved.attributes.uploadOperations) await api.upload(operation, bytes);
      await api.patch(`/v1/appAssetLibraryImages/${reserved.id}`, { data: { type: 'appAssetLibraryImages', id: reserved.id, attributes: { uploaded: true } } });
      let image;
      for (let attempt = 0; ; attempt++) {
        image = (await api.get(`/v1/appAssetLibraryImages/${reserved.id}`)).data;
        if (image.attributes.state === 'FAILED') throw new Error(`Screenshot ${name} rejected: ${JSON.stringify(image.attributes.stateDetails)}`);
        if (!PENDING_ASSET.has(image.attributes.state)) break;
        if (attempt >= 60) throw new Error(`Screenshot ${name} still processing`);
        await sleep(5000);
      }
      const groups = mappings.filter(m => m.specs?.includes(image.attributes.specId) && familyOfGroup.get(m.placementGroupId) === family);
      if (!groups.length) throw new Error(`Screenshot ${name} matched spec ${image.attributes.specId}, which no ${family} App Store screenshot group accepts`);
      uploads.push({ id: image.id, family, group: groups[0].placementGroupId });
    }
  }
  log(`Uploaded ${uploads.length} screenshot(s) to the asset library: ${[...new Set(uploads.map(u => u.group))].join(', ')}`);
  return { uploads, familyOfGroup };
}

async function placeScreenshots(api, { localization, uploads, familyOfGroup, log }) {
  const families = new Set(uploads.map(u => u.family));
  const existing = await listAll(api, `/v1/appStoreVersionLocalizations/${localization.id}/placements?filter[placementType]=APP_SCREENSHOT&limit=200`);
  const byGroup = new Map();
  for (const upload of uploads) {
    const placement = (await api.post('/v1/appAssetLibraryPlacements', { data: {
      type: 'appAssetLibraryPlacements',
      attributes: { placementType: 'APP_SCREENSHOT', placementGroup: upload.group },
      relationships: {
        image: { data: { type: 'appAssetLibraryImages', id: upload.id } },
        appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization.id } },
      },
    } })).data;
    byGroup.set(upload.group, [...(byGroup.get(upload.group) ?? []), placement.id]);
  }
  // Remove old placements only once the new ones exist, so a failure never empties the listing.
  // Every iPhone/iPad size is cleared so smaller displays scale from the fresh captures.
  for (const old of existing.filter(p => families.has(familyOfGroup.get(p.attributes.placementGroup)))) {
    await api.delete(`/v1/appAssetLibraryPlacements/${old.id}`);
  }
  for (const [group, ids] of byGroup) {
    await api.post('/v1/appAssetLibraryPlacementOrderingRequests', { data: {
      type: 'appAssetLibraryPlacementOrderingRequests',
      attributes: { placementGroup: group },
      relationships: {
        orderedPlacements: { data: ids.map(id => ({ type: 'appAssetLibraryPlacements', id })) },
        appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization.id } },
      },
    } });
  }
  log(`${localization.attributes.locale}: replaced ${existing.length} screenshot placement(s) with ${uploads.length}`);
}

export async function loadScreenshots(dir) {
  const result = {};
  for (const [device, family] of Object.entries(DEVICE_FAMILIES)) {
    const files = (await readdir(path.join(dir, device)).catch(() => []))
      .filter(name => /\.(png|jpe?g)$/i.test(name)).sort().map(name => path.join(dir, device, name));
    if (files.length) result[family] = files;
  }
  return result;
}

async function openSubmission(api, { appId, appStoreVersionId }) {
  const submission = (await api.get(`/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&filter[state]=${OPEN_SUBMISSION.join(',')}&limit=10`)).data[0];
  if (!submission) return { submission: null, items: [] };
  const items = (await api.get(`/v1/reviewSubmissions/${submission.id}/items?include=appStoreVersion&limit=50`)).data;
  const existing = items.find(item => appStoreVersionId && item.relationships?.appStoreVersion?.data?.id === appStoreVersionId);
  // Apple does not accept new items on a submission with unresolved issues.
  if (submission.attributes?.state === 'UNRESOLVED_ISSUES' && !existing) {
    throw new Error(`Review submission ${submission.id} has unresolved issues for other items; resolve or cancel it in App Store Connect first`);
  }
  return { submission, existing };
}

async function submitForReview(api, { appId, appStoreVersion, log }) {
  let { submission, existing } = await openSubmission(api, { appId, appStoreVersionId: appStoreVersion.id });
  if (!submission) {
    submission = (await api.post('/v1/reviewSubmissions', { data: {
      type: 'reviewSubmissions', attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: appId } } },
    } })).data;
  }
  if (existing?.attributes?.state === 'REJECTED') {
    // A rejected item must be marked resolved before the submission can be resubmitted.
    await api.patch(`/v1/reviewSubmissionItems/${existing.id}`, { data: { type: 'reviewSubmissionItems', id: existing.id, attributes: { resolved: true } } });
  } else if (!existing) {
    await api.post('/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: submission.id } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: appStoreVersion.id } },
    } } });
  }
  await api.patch(`/v1/reviewSubmissions/${submission.id}`, { data: { type: 'reviewSubmissions', id: submission.id, attributes: { submitted: true } } });
  log(`Submitted review submission ${submission.id} for App Review`);
  return submission.id;
}

export async function releaseToAppStore(api, {
  appId, version, buildNumber, screenshots = {}, whatsNew, dryRun = false,
  log = console.log, sleep = ms => new Promise(r => setTimeout(r, ms)),
}) {
  const build = await findBuild(api, { appId, version, buildNumber });
  const number = build.attributes.version ?? build.attributes.buildNumber;
  log(`Using processed build ${version} (${number}), id ${build.id}`);

  const active = (await api.get(`/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&filter[state]=${ACTIVE_SUBMISSION.join(',')}&limit=10`)).data;
  // Plan without mutating, check the open submission, then apply the version change.
  const plan = await prepareVersion(api, { appId, version, dryRun: true, log });
  const { inFlight, hasRelease } = plan;
  if (inFlight || active.length) {
    const what = inFlight ? `${inFlight.attributes.versionString} is ${versionState(inFlight)}` : 'a review submission is already waiting or in review';
    log(`Not submitting: ${what}. Release or withdraw it in App Store Connect first.`);
    return { status: 'already-in-review', buildId: build.id };
  }
  await openSubmission(api, { appId, appStoreVersionId: plan.appStoreVersion?.id });
  if (dryRun) {
    if (plan.appStoreVersion) {
      for (const localization of (await api.get(`/v1/appStoreVersions/${plan.appStoreVersion.id}/appStoreVersionLocalizations?limit=50`)).data) {
        const placements = await listAll(api, `/v1/appStoreVersionLocalizations/${localization.id}/placements?filter[placementType]=APP_SCREENSHOT&limit=200`);
        const groups = [...new Set(placements.map(p => p.attributes.placementGroup))].join(', ') || 'none';
        log(`${localization.attributes.locale}: ${placements.length} screenshot placement(s) in ${groups}`);
      }
    }
    log(`Dry run: would attach build ${number}, replace screenshots for ${Object.keys(screenshots).join(', ') || 'no devices'}${hasRelease && whatsNew ? ', set release notes' : ''} and submit for review.`);
    return { status: 'dry-run', buildId: build.id };
  }

  const { appStoreVersion } = await prepareVersion(api, { appId, version, dryRun: false, log: () => {} });
  await api.patch(`/v1/appStoreVersions/${appStoreVersion.id}/relationships/build`, { data: { type: 'builds', id: build.id } });
  log(`Attached build ${number} to App Store version ${version}`);

  const localizations = (await api.get(`/v1/appStoreVersions/${appStoreVersion.id}/appStoreVersionLocalizations?limit=50`)).data;
  if (!localizations.length) throw new Error('App Store version has no localizations; complete the listing in App Store Connect');
  // Upload before touching placements so a failed upload never leaves the listing without screenshots.
  const library = Object.keys(screenshots).length ? await uploadScreenshots(api, { appId, screenshots, log, sleep }) : null;
  for (const localization of localizations) {
    // Apple rejects release notes on an app's first App Store version.
    if (hasRelease && whatsNew) {
      await api.patch(`/v1/appStoreVersionLocalizations/${localization.id}`, { data: { type: 'appStoreVersionLocalizations', id: localization.id, attributes: { whatsNew } } });
    }
    if (library) await placeScreenshots(api, { localization, ...library, log });
  }

  const submissionId = await submitForReview(api, { appId, appStoreVersion, log });
  return { status: 'submitted', buildId: build.id, submissionId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = process.env;
  for (const name of ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY', 'APP_ID', 'VERSION']) {
    if (!env[name]) throw new Error(`Missing ${name}`);
  }
  const api = ascClient({ token: () => makeJWT({ keyId: env.ASC_KEY_ID, issuerId: env.ASC_ISSUER_ID, privateKey: env.ASC_PRIVATE_KEY }) });
  const result = await releaseToAppStore(api, {
    appId: env.APP_ID, version: env.VERSION, buildNumber: env.BUILD_NUMBER || undefined,
    screenshots: env.SCREENSHOTS_DIR ? await loadScreenshots(env.SCREENSHOTS_DIR) : {},
    whatsNew: env.WHATS_NEW || undefined, dryRun: env.DRY_RUN === 'true',
  });
  console.log(JSON.stringify(result));
  if (env.GITHUB_OUTPUT) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(env.GITHUB_OUTPUT, `status=${result.status}\n`);
  }
}
