// Group access and beta review are separate from public App Store publication.
export async function configureTestFlight({ token, buildId, groupIds, fetchImpl = fetch }) {
  const origin = 'https://api.appstoreconnect.apple.com';
  async function request(path, body) {
    const url = new URL(path, origin);
    if (url.origin !== origin) throw new Error('Unexpected App Store Connect pagination origin');
    const response = await fetchImpl(url.href, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`App Store Connect ${response.status}: ${await response.text()}`);
    return response.status === 204 ? null : response.json();
  }

  if (!groupIds.length) throw new Error('No TestFlight groups configured; build is processed but group access is unverified');
  const groups = [];
  for (const groupId of [...new Set(groupIds)]) {
    const group = (await request(`/v1/betaGroups/${encodeURIComponent(groupId)}`)).data;
    let next = `/v1/betaGroups/${encodeURIComponent(groupId)}/relationships/builds?limit=200`;
    let hasBuild = false;
    while (next && !hasBuild) {
      const page = await request(next);
      hasBuild = page.data.some(build => build.id === buildId);
      next = page.links?.next;
    }
    if (!hasBuild) {
      if (group.attributes.isInternalGroup) {
        throw new Error('Internal TestFlight group does not contain this build. Enable automatic distribution or add it in App Store Connect.');
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
