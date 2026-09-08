/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const goal = {name: "Read", target: 100, timeframeType: "year" as const, startDate: "2026-01-01", endDate: "2026-12-31", color: "#FF4747", icon: "book", isPublic: false};
async function fixture() {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity({subject: "alice"});
  const bob = t.withIdentity({subject: "bob"});
  const user = await alice.mutation(api.users.create, {clerkId: "alice", email: "alice@example.test", name: "Alice"});
  const challenge = await alice.mutation(api.challenges.create, {...goal, userId: "alice"});
  const entry = await alice.mutation(api.entries.create, {userId: "alice", challengeId: challenge.id, date: "2026-09-09", count: 5});
  return {t, alice, bob, user, challenge, entry};
}

describe("database authorization", () => {
  it("rejects anonymous reads and writes directly at the database boundary", async () => {
    const {t, challenge, entry, user} = await fixture();
    const calls = [
      () => t.query(api.challenges.listByUser, {userId: "alice"}),
      () => t.query(api.challenges.get, {id: challenge.id}),
      () => t.query(api.entries.get, {id: entry.id}),
      () => t.query(api.users.getByClerkId, {clerkId: "alice"}),
      () => t.mutation(api.users.update, {id: user.id, name: "Stolen"}),
      () => t.mutation(api.challenges.remove, {id: challenge.id}),
      () => t.mutation(api.entries.create, {userId: "alice", challengeId: challenge.id, date: "2026-09-09", count: 100}),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow("Authentication required");
  });

  it("rejects forged owner IDs and cross-account access including legacy IDs", async () => {
    const {bob, alice, user, challenge, entry} = await fixture();
    const calls = [
      () => bob.query(api.challenges.listActive, {userId: "alice"}),
      () => bob.query(api.challenges.getIncludingDeleted, {id: challenge.id}),
      () => bob.query(api.entries.listByChallenge, {challengeId: challenge.id}),
      () => bob.query(api.entries.listByUser, {userId: user.id}),
      () => bob.mutation(api.users.restore, {id: user.id}),
      () => bob.mutation(api.challenges.update, {id: challenge.id, name: "Stolen"}),
      () => bob.mutation(api.challenges.restore, {id: challenge.id, userId: "alice"}),
      () => bob.mutation(api.entries.update, {id: entry.id, count: 999}),
      () => bob.mutation(api.entries.remove, {id: entry.id}),
      () => bob.mutation(api.entries.restore, {id: entry.id, userId: "alice"}),
      () => bob.mutation(api.entries.create, {userId: "bob", challengeId: challenge.id, date: "2026-09-09", count: 100}),
      () => bob.mutation(api.users.create, {clerkId: "alice", email: "bob@example.test", name: "Stolen"}),
    ];
    for (const call of calls) await expect(call()).rejects.toThrow("Not authorized");
    expect(await alice.query(api.entries.get, {id: entry.id})).toMatchObject({count: 5});
    expect(await alice.query(api.challenges.get, {id: challenge.id})).toMatchObject({name: "Read"});
  });

  it("lets owners edit, delete and restore their data including legacy owner IDs", async () => {
    const {alice, user, challenge, entry} = await fixture();
    const legacy = await alice.mutation(api.challenges.create, {...goal, userId: user.id});
    expect(await alice.query(api.challenges.get, {id: legacy.id})).toMatchObject({userId: user.id});
    await alice.mutation(api.entries.update, {id: entry.id, count: 6});
    await alice.mutation(api.challenges.remove, {id: challenge.id});
    await alice.mutation(api.challenges.restore, {id: challenge.id, userId: "alice"});
    expect(await alice.query(api.entries.get, {id: entry.id})).toMatchObject({count: 6});
  });

  it("keeps new and legacy public goals private and disables follows", async () => {
    const {t, alice, challenge} = await fixture();
    await t.run(ctx => ctx.db.patch(challenge.id, {isPublic: true}));
    expect(await t.query(api.challenges.listPublic, {})).toEqual([]);
    expect(await alice.query(api.challenges.get, {id: challenge.id})).toMatchObject({isPublic: false});
    expect(await alice.mutation(api.challenges.update, {id: challenge.id, isPublic: true})).toMatchObject({isPublic: false});
    expect(await alice.mutation(api.challenges.create, {...goal, userId: "alice", isPublic: true})).toMatchObject({isPublic: false});
    await expect(alice.mutation(api.follows.follow, {userId: "alice", challengeId: challenge.id})).rejects.toThrow("unavailable");
  });

  it("deletes only the authenticated account, including its legacy-owned records", async () => {
    const {alice, bob, user, challenge, entry, t} = await fixture();
    const other = await bob.mutation(api.challenges.create, {...goal, userId: "bob"});
    const legacy = await alice.mutation(api.challenges.create, {...goal, userId: user.id});
    await alice.mutation(api.users.deleteOwnAccountData, {});
    for (const id of [user.id, challenge.id, entry.id, legacy.id]) expect(await t.run(ctx => ctx.db.get(id))).toBeNull();
    expect(await bob.query(api.challenges.get, {id: other.id})).toMatchObject({name: "Read"});
  });
});

// The moderation controls are ready for review while discovery remains disabled.
describe("moderation", () => {
  it("quarantines a reported legacy public goal and deduplicates retries", async () => {
    const {t, bob, challenge} = await fixture();
    await t.run(ctx => ctx.db.patch(challenge.id, {isPublic: true}));
    for (let i = 0; i < 2; i++) await bob.mutation(api.moderation.report, {challengeId: challenge.id, reason: "abuse"});
    expect(await t.run(ctx => ctx.db.get(challenge.id))).toMatchObject({isPublic: false, moderationStatus: "pending"});
    expect(await t.run(ctx => ctx.db.query("moderationReports").collect())).toHaveLength(1);
    await expect(bob.query(api.moderation.queue, {})).rejects.toThrow("Moderator access required");
  });
  it("does not accept reports against private content or anonymous reports", async () => {
    const {t, bob, challenge} = await fixture();
    await expect(bob.mutation(api.moderation.report, {challengeId: challenge.id, reason: "spam"})).rejects.toThrow("Content unavailable");
    await expect(t.mutation(api.moderation.report, {challengeId: challenge.id, reason: "spam"})).rejects.toThrow("Authentication required");
  });
  it("keeps block lists private and only lets the blocker undo a block", async () => {
    const {alice, bob} = await fixture();
    await alice.mutation(api.moderation.block, {blockedUserId: "bob"});
    await alice.mutation(api.moderation.block, {blockedUserId: "bob"});
    const blocks = await alice.query(api.moderation.blocks, {});
    expect(blocks).toHaveLength(1);
    expect(await bob.query(api.moderation.blocks, {})).toEqual([]);
    await expect(bob.mutation(api.moderation.unblock, {id: blocks[0]._id})).rejects.toThrow("Not authorized");
    await alice.mutation(api.moderation.unblock, {id: blocks[0]._id});
    expect(await alice.query(api.moderation.blocks, {})).toEqual([]);
  });
});
