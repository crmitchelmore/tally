/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { digestKey, generateKey, apiKeyDigest } from "../app/api/v1/_lib/api-key";
import { validateCreateEntry } from "../app/api/v1/_lib/validate";
const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const goal = {name:"Mobility",target:100,timeframeType:"year" as const,startDate:"2026-01-01",endDate:"2026-12-31",color:"#FF4747",icon:"tally",isPublic:false};
async function fixture(scopes: ("challenges:read" | "entries:write")[] = ["challenges:read","entries:write"]) {
  const t = convexTest(schema, modules), alice = t.withIdentity({subject:"alice"}), bob = t.withIdentity({subject:"bob"});
  const challenge = await alice.mutation(api.challenges.create,{...goal,userId:"alice"});
  const other = await bob.mutation(api.challenges.create,{...goal,userId:"bob"});
  const {digest,prefix} = generateKey();
  const id = await alice.mutation(api.apiKeys.create,{name:"Test",digest,prefix,scopes});
  const entry = {challengeId:challenge.id,date:"2026-01-02",count:1,externalEventId:"mobility:event-1"};
  return {t,alice,bob,challenge,other,digest,id,entry};
}
describe("scoped API keys", () => {
  it("generates 256-bit random capabilities, stores no plaintext and hides digests from lists", async () => {
    const first = generateKey(), second = generateKey();
    expect(first.key).not.toBe(second.key);
    expect(first.key).toMatch(/^tally_[a-f0-9]{64}$/);
    expect(first.digest).toBe(digestKey(first.key));
    const {t,alice} = await fixture();
    const stored = await t.run(ctx => ctx.db.query("apiKeys").collect());
    expect(stored[0]).not.toHaveProperty("key");
    expect((await alice.query(api.apiKeys.list,{}))[0]).not.toHaveProperty("digest");
  });
  it("rejects duplicate digest registration across owners, concurrently and after revocation", async () => {
    const {t,alice,bob,digest,id} = await fixture();
    const args = {name:"Duplicate",digest,prefix:"tally_12345678",scopes:["entries:write" as const]};
    await expect(bob.mutation(api.apiKeys.create,args)).rejects.toThrow("KEY_EXISTS");
    await expect(alice.mutation(api.apiKeys.create,args)).rejects.toThrow("KEY_EXISTS");
    await alice.mutation(api.apiKeys.revoke,{id});
    await expect(bob.mutation(api.apiKeys.create,args)).rejects.toThrow("KEY_EXISTS");
    const {digest:freshDigest,prefix:freshPrefix} = generateKey();
    const fresh = {digest:freshDigest,prefix:freshPrefix};
    const concurrent = await Promise.allSettled([
      alice.mutation(api.apiKeys.create,{...args,...fresh}),
      bob.mutation(api.apiKeys.create,{...args,...fresh}),
    ]);
    expect(concurrent.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(await t.run(ctx => ctx.db.query("apiKeys").withIndex("by_digest",q => q.eq("digest",fresh.digest)).collect())).toHaveLength(1);
  });
  it("requires Clerk identity for management and isolates revoke/list", async () => {
    const {t,alice,bob,id} = await fixture();
    await expect(t.query(api.apiKeys.list,{})).rejects.toThrow("UNAUTHORIZED");
    await expect(t.mutation(api.apiKeys.create,{name:"Bad",digest:"a".repeat(64),prefix:"tally_12345678",scopes:["entries:write"]})).rejects.toThrow("UNAUTHORIZED");
    expect(await bob.query(api.apiKeys.list,{})).toEqual([]);
    await expect(bob.mutation(api.apiKeys.revoke,{id})).rejects.toThrow("FORBIDDEN");
    expect(await alice.query(api.apiKeys.list,{})).toHaveLength(1);
  });
  it("enforces scope, revoked state, invalid key and cross-owner challenge isolation", async () => {
    const {t,alice,id,digest,entry,other} = await fixture(["challenges:read"]);
    expect(await t.query(api.apiKeys.challenges,{digest,includeArchived:true})).toHaveLength(1);
    await expect(t.mutation(api.apiKeys.createEntry,{digest,entry})).rejects.toThrow("FORBIDDEN");
    const write = await fixture(["entries:write"]);
    await expect(write.t.query(api.apiKeys.challenges,{digest:write.digest,includeArchived:true})).rejects.toThrow("FORBIDDEN");
    await expect(write.t.mutation(api.apiKeys.createEntry,{digest:write.digest,entry:{...write.entry,challengeId:write.other.id}})).rejects.toThrow("FORBIDDEN");
    await alice.mutation(api.apiKeys.revoke,{id});
    await alice.mutation(api.apiKeys.revoke,{id});
    await expect(t.query(api.apiKeys.challenges,{digest,includeArchived:true})).rejects.toThrow("UNAUTHORIZED");
    await expect(t.query(api.apiKeys.challenges,{digest:"invalid",includeArchived:true})).rejects.toThrow("UNAUTHORIZED");
    await write.alice.mutation(api.apiKeys.revoke,{id:write.id});
    await expect(write.t.mutation(api.apiKeys.createEntry,{digest:write.digest,entry:write.entry})).rejects.toThrow("UNAUTHORIZED");
  });
  it("atomically deduplicates concurrent retries, conflicts and survives key rotation", async () => {
    const {t,alice,digest,entry} = await fixture();
    const results = await Promise.all([t.mutation(api.apiKeys.createEntry,{digest,entry}),t.mutation(api.apiKeys.createEntry,{digest,entry})]);
    expect(results[0].entry.id).toBe(results[1].entry.id);
    expect(results.filter(r => !r.replayed)).toHaveLength(1);
    await expect(t.mutation(api.apiKeys.createEntry,{digest,entry:{...entry,count:2}})).rejects.toThrow("EVENT_CONFLICT");
    const rotated = generateKey();
    await alice.mutation(api.apiKeys.create,{name:"Rotated",digest:rotated.digest,prefix:rotated.prefix,scopes:["entries:write"]});
    expect(await t.mutation(api.apiKeys.createEntry,{digest:rotated.digest,entry})).toMatchObject({replayed:true,entry:{id:results[0].entry.id}});
    expect(await alice.query(api.entries.listByUser,{userId:"alice"})).toHaveLength(1);
    await alice.mutation(api.entries.remove,{id:results[0].entry.id});
    expect(await t.mutation(api.apiKeys.createEntry,{digest,entry})).toMatchObject({replayed:true});
    expect(await alice.query(api.entries.listByUser,{userId:"alice"})).toHaveLength(0);
  });
  it("preserves session clients and optional idempotency; scopes event IDs to owner", async () => {
    const {t,alice,bob,entry,other,digest} = await fixture();
    const {externalEventId,...legacy} = entry;
    const first = await alice.mutation(api.entries.create,{...legacy,userId:"alice"});
    const second = await alice.mutation(api.entries.create,{...legacy,userId:"alice"});
    expect(first.id).not.toBe(second.id);
    const keyed = await alice.mutation(api.entries.create,{...entry,userId:"alice"});
    expect((await t.mutation(api.apiKeys.createEntry,{digest,entry})).entry.id).toBe(keyed.id);
    expect(await bob.mutation(api.entries.create,{...entry,userId:"bob",challengeId:other.id})).toMatchObject({userId:"bob"});
  });
  it("removes capabilities and receipts on account deletion", async () => {
    const {t,alice,digest,entry} = await fixture();
    await t.mutation(api.apiKeys.createEntry,{digest,entry});
    await alice.mutation(api.users.deleteOwnAccountData,{});
    expect(await t.run(ctx => ctx.db.query("entryReceipts").collect())).toEqual([]);
    await expect(t.query(api.apiKeys.challenges,{digest,includeArchived:true})).rejects.toThrow("UNAUTHORIZED");
  });
  it("rejects malformed capabilities without falling back to session auth", () => {
    expect(apiKeyDigest(new Request("https://example.test",{headers:{Authorization:"Bearer tally_invalid"}}))).toBe("invalid");
    expect(apiKeyDigest(new Request("https://example.test",{headers:{Authorization:"Bearer legacy-session"}}))).toBeNull();
  });
  it("validates integration dates in an explicit timezone and rejects nonfinite sets/count", () => {
    vi.useFakeTimers();vi.setSystemTime(new Date("2026-10-13T23:30:00Z"));
    const entry = {challengeId:"goal",date:"2026-10-14",count:1,timeZone:"Europe/London"};
    expect(validateCreateEntry(entry).valid).toBe(true);
    expect(validateCreateEntry({...entry,timeZone:"Invalid/Zone"}).valid).toBe(false);
    expect(validateCreateEntry({...entry,count:NaN}).valid).toBe(false);
    expect(validateCreateEntry({...entry,sets:[Infinity]}).valid).toBe(false);
    vi.useRealTimers();
  });
});
