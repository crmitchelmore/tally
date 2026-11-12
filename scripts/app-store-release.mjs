// Moves a processed TestFlight build into App Store review. TestFlight distribution
// alone never publishes the app; this attaches the build to an editable App Store
// version, refreshes screenshots and submits it for App Review.
import crypto from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://api.appstoreconnect.apple.com';
const EDITABLE = new Set(['PREPARE_FOR_SUBMISSION', 'READY_FOR_REVIEW', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY']);
const IN_FLIGHT = new Set(['WAITING_FOR_REVIEW', 'IN_REVIEW', 'WAITING_FOR_EXPORT_COMPLIANCE', 'PENDING_DEVELOPER_RELEASE', 'PENDING_APPLE_RELEASE', 'ACCEPTED', 'PROCESSING_FOR_DISTRIBUTION', 'PENDING_CONTRACT']);
const RELEASED = new Set(['READY_FOR_SALE', 'READY_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_VERSION', 'REMOVED_FROM_SALE', 'DEVELOPER_REMOVED_FROM_SALE']);
const OPEN_SUBMISSION = ['READY_FOR_REVIEW', 'UNRESOLVED_ISSUES'];
const ACTIVE_SUBMISSION = ['WAITING_FOR_REVIEW', 'IN_REVIEW'];
export const DISPLAY_TYPES = { iphone: 'APP_IPHONE_67', ipad: 'APP_IPAD_PRO_3GEN_129' };

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
    'filter[app]': appId, 'filter[preReleaseVersion.version]': version,
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

async function replaceScreenshots(api, { localization, displayType, files, log, sleep }) {
  const sets = (await api.get(`/v1/appStoreVersionLocalizations/${localization.id}/appScreenshotSets?limit=50`)).data;
  let set = sets.find(s => s.attributes.screenshotDisplayType === displayType);
  if (!set) {
    set = (await api.post('/v1/appScreenshotSets', { data: {
      type: 'appScreenshotSets', attributes: { screenshotDisplayType: displayType },
      relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: localization.id } } },
    } })).data;
  }
  for (const old of (await api.get(`/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data) {
    await api.delete(`/v1/appScreenshots/${old.id}`);
  }
  for (const file of files) {
    const bytes = await readFile(file);
    const reserved = (await api.post('/v1/appScreenshots', { data: {
      type: 'appScreenshots', attributes: { fileName: path.basename(file), fileSize: bytes.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } },
    } })).data;
    for (const operation of reserved.attributes.uploadOperations) await api.upload(operation, bytes);
    const checksum = crypto.createHash('md5').update(bytes).digest('hex');
    await api.patch(`/v1/appScreenshots/${reserved.id}`, { data: { type: 'appScreenshots', id: reserved.id, attributes: { uploaded: true, sourceFileChecksum: checksum } } });
    for (let attempt = 0; ; attempt++) {
      const state = (await api.get(`/v1/appScreenshots/${reserved.id}`)).data.attributes.assetDeliveryState;
      if (state?.state === 'COMPLETE') break;
      if (state?.state === 'FAILED') throw new Error(`Screenshot ${path.basename(file)} rejected: ${JSON.stringify(state.errors)}`);
      if (attempt >= 60) throw new Error(`Screenshot ${path.basename(file)} still processing`);
      await sleep(5000);
    }
  }
  log(`${localization.attributes.locale} ${displayType}: ${files.length} screenshot(s) uploaded`);
}

export async function loadScreenshots(dir) {
  const result = {};
  for (const [device, displayType] of Object.entries(DISPLAY_TYPES)) {
    const files = (await readdir(path.join(dir, device)).catch(() => []))
      .filter(name => /\.(png|jpe?g)$/i.test(name)).sort().map(name => path.join(dir, device, name));
    if (files.length) result[displayType] = files;
  }
  return result;
}

async function submitForReview(api, { appId, appStoreVersion, log }) {
  const query = state => `/v1/reviewSubmissions?filter[app]=${appId}&filter[platform]=IOS&filter[state]=${state.join(',')}&limit=10`;
  let submission = (await api.get(query(OPEN_SUBMISSION))).data[0];
  if (!submission) {
    submission = (await api.post('/v1/reviewSubmissions', { data: {
      type: 'reviewSubmissions', attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: appId } } },
    } })).data;
  }
  const items = (await api.get(`/v1/reviewSubmissions/${submission.id}/items?include=appStoreVersion&limit=50`)).data;
  const existing = items.find(item => item.relationships?.appStoreVersion?.data?.id === appStoreVersion.id);
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
  const { appStoreVersion, inFlight, hasRelease } = await prepareVersion(api, { appId, version, dryRun: dryRun || active.length > 0, log });
  if (inFlight || active.length) {
    const what = inFlight ? `${inFlight.attributes.versionString} is ${versionState(inFlight)}` : 'a review submission is already waiting or in review';
    log(`Not submitting: ${what}. Release or withdraw it in App Store Connect first.`);
    return { status: 'already-in-review', buildId: build.id };
  }
  if (dryRun) {
    log(`Dry run: would attach build ${number}, replace ${Object.keys(screenshots).length} screenshot set(s)${hasRelease && whatsNew ? ', set release notes' : ''} and submit for review.`);
    return { status: 'dry-run', buildId: build.id };
  }

  await api.patch(`/v1/appStoreVersions/${appStoreVersion.id}/relationships/build`, { data: { type: 'builds', id: build.id } });
  log(`Attached build ${number} to App Store version ${version}`);

  const localizations = (await api.get(`/v1/appStoreVersions/${appStoreVersion.id}/appStoreVersionLocalizations?limit=50`)).data;
  if (!localizations.length) throw new Error('App Store version has no localizations; complete the listing in App Store Connect');
  for (const localization of localizations) {
    // Apple rejects release notes on an app's first App Store version.
    if (hasRelease && whatsNew) {
      await api.patch(`/v1/appStoreVersionLocalizations/${localization.id}`, { data: { type: 'appStoreVersionLocalizations', id: localization.id, attributes: { whatsNew } } });
    }
    for (const [displayType, files] of Object.entries(screenshots)) {
      await replaceScreenshots(api, { localization, displayType, files, log, sleep });
    }
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
