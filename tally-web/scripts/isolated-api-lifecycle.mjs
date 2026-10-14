// Real HTTP lifecycle. Requires an explicitly isolated Clerk development instance
// and Convex deployment; never accepts production credentials or targets.
import assert from 'node:assert/strict';
export async function lifecycle(env) {
  assert(env.CLERK_SECRET_KEY?.startsWith('sk_test_'), 'Development Clerk key required');
  assert(env.NEXT_PUBLIC_CONVEX_URL === 'https://precise-moose-272.convex.cloud', 'Isolated Convex target required');
  const base = 'http://localhost:3107';
  const clerk = async (path, method='POST', body) => {
    const r = await fetch('https://api.clerk.com/v1'+path,{method,headers:{Authorization:'Bearer '+env.CLERK_SECRET_KEY,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const data = await r.json();
    assert(r.ok, `Clerk ${path.split('/')[1]} returned ${r.status}`); return data;
  };
  let user, session, token;
  const keys=[];
  const req = async (path, method='GET', body, credential=token, expected=200) => {
    const r=await fetch(base+'/api/v1/'+path,{method,headers:{Authorization:'Bearer '+credential,Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    assert.equal(r.status,expected,`${method} ${path} expected ${expected}, got ${r.status}`);
    return r.json();
  };
  try {
    user=await clerk('/users','POST',{email_address:[`lifecycle-${Date.now()}+clerk_test@example.com`],skip_password_requirement:true});
    // Clerk's supported development-only session creation; not a custom JWT/auth bypass.
    session=await clerk('/sessions','POST',{user_id:user.id});
    token=(await clerk(`/sessions/${session.id}/tokens`)).jwt;
    const challenge=(await req('challenges','POST',{name:'Isolated lifecycle fixture',target:100,timeframeType:'year'},token,201)).challenge;
    const key=await req('api-keys','POST',{name:'Isolated lifecycle',scopes:['challenges:read','entries:write']},token,201); keys.push(key.id);
    assert(key.key?.startsWith('tally_')); console.log('PASS owner key generation');
    const listed=await req('api-keys'); assert(!JSON.stringify(listed).includes(key.key)); console.log('PASS list never reveals raw key');
    const goals=await req('challenges','GET',undefined,key.key); assert(goals.challenges.some(x=>x.challenge.id===challenge.id)); console.log('PASS scoped challenge read');
    const entry={challengeId:challenge.id,date:new Date().toISOString().slice(0,10),count:1,externalEventId:'isolated-'+Date.now(),timeZone:'Europe/London'};
    const created=await req('entries','POST',entry,key.key,201); const replay=await req('entries','POST',entry,key.key); assert.equal(replay.entry.id,created.entry.id); assert.equal(replay.replayed,true); console.log('PASS write and replay');
    await req('entries','POST',{...entry,count:2},key.key,409); console.log('PASS replay conflict');
    const read=await req('api-keys','POST',{name:'Read only',scopes:['challenges:read']},token,201);keys.push(read.id);
    await req('entries','POST',{...entry,externalEventId:entry.externalEventId+'-denied'},read.key,403); await req('api-keys','GET',undefined,key.key,401); console.log('PASS scope and management restrictions');
    await req('api-keys','DELETE',{id:key.id}); await req('challenges','GET',undefined,key.key,401); await req('entries','POST',entry,key.key,401); console.log('PASS revoked read/write rejection');
    console.log('PASS isolated real HTTP lifecycle complete');
  } finally {
    for(const id of keys) {try {await req('api-keys','DELETE',{id});}catch{}}
    if(session) await clerk(`/sessions/${session.id}/revoke`);
    if(user) await clerk(`/users/${user.id}`,'DELETE');
  }
}
