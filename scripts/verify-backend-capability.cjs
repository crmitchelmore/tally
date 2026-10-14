// Read-only capability probe: invalid digest must be rejected by the newly
// deployed function, not accepted or reported as an unknown function.
(async () => {
  const {ConvexHttpClient}=await import('../tally-web/node_modules/convex/dist/esm/browser/index.js');
  const {makeFunctionReference}=await import('../tally-web/node_modules/convex/dist/esm/server/index.js');
  const url=new URL(process.env.NEXT_PUBLIC_CONVEX_URL);
  if(url.protocol!=='https:' || !url.hostname.endsWith('.convex.cloud')) throw new Error('Invalid backend target');
  const client=new ConvexHttpClient(url.origin);
  try {
    await client.query(makeFunctionReference('apiKeys:challenges'),{digest:'0'.repeat(64),includeArchived:false});
    throw new Error('Invalid capability unexpectedly accepted');
  } catch(error) {
    if(!error?.data || error.data.code!=='UNAUTHORIZED') throw new Error('Backend capability verification failed');
  }
  console.log('Deployed backend capability verified: invalid key rejected.');
})().catch(()=>{console.error('Backend capability gate failed; web release blocked.');process.exit(1)});
