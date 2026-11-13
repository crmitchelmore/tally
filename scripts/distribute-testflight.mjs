// Group access and beta review are separate from public App Store publication.
// Automatic internal distribution attaches the build a few minutes after processing,
// so internal groups are re-checked before reporting failure.
export async function configureTestFlight({
  token, buildId, groupIds, fetchImpl = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), internalWaitMs = 15 * 60 * 1000, pollMs = 30 * 1000,
}) {
  const origin = 'https://api.appstoreconnect.apple.com';
  async function request(path, body) {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw new Error('Unexpected App Store Connect pagination origin');
    const response = await fetchImpl(url.href, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${typeof token === 'function' ? token() : token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`App Store Connect ${response.status}: ${await response.text()}`);
    return response.status === 204 ? null : response.json();
  }

  if (!groupIds.length) throw new Error('No TestFlight groups configured; build is processed but group access is unverified');
  const groups = [];
  for (const groupId of [...new Set(groupIds)]) {
    const group = (await request(`/v1/betaGroups/${encodeURIComponent(groupId)}`)).data;
    const groupHasBuild = async () => {
      for (let next = `/v1/betaGroups/${encodeURIComponent(groupId)}/relationships/builds?limit=200`; next;) {
        const page = await request(next);
        if (page.data.some(build => build.id === buildId)) return true;
        next = page.links?.next;
      }
      return false;
    };
    let hasBuild = await groupHasBuild();
    for (let waited = 0; !hasBuild && group.attributes.isInternalGroup && waited < internalWaitMs; waited += pollMs) {
      await sleep(pollMs);
      hasBuild = await groupHasBuild();
    }
    if (!hasBuild) {
      if (group.attributes.isInternalGroup) {
        throw new Error(`Internal TestFlight group still lacks this build after ${Math.round(internalWaitMs / 60000)} minutes. Enable automatic distribution or add it in App Store Connect.`);
      }
      await request(`/v1/builds/${encodeURIComponent(buildId)}/relationships/betaGroups`, {
        data: [{ type: 'betaGroups', id: groupId }],
      });
    }
    groups.push({ id: groupId, internal: group.attributes.isInternalGroup });
  }

  // Internal groups do not require beta app review, and cannot be attached using
  // the external-group endpoint. Never interpret an arbitrary 409 as success.
  let betaReview = 'not-required';
  if (groups.some(group => !group.internal)) {
    await request('/v1/betaAppReviewSubmissions', {
      data: { type: 'betaAppReviewSubmissions', relationships: {
        build: { data: { type: 'builds', id: buildId } },
      } },
    });
    betaReview = 'submitted';
  }
  return { groups: groups.length, betaReview };
}
