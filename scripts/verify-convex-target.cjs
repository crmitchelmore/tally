// Never print credentials or resolved environment values.
const { TALLY_RESOLVED_CONVEX_URL: resolved, NEXT_PUBLIC_CONVEX_URL: expected } = process.env;
function normalized(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid deployment URL');
  return url.origin;
}
try {
  if (!resolved || !expected || normalized(resolved) !== normalized(expected)) throw new Error('Deployment mismatch');
  console.log('Convex target matches web configuration.');
} catch {
  console.error('Convex target verification failed; no backend or web release allowed.');
  process.exit(1);
}
