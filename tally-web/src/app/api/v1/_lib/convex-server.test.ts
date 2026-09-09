import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({auth: vi.fn(), headers: vi.fn(), clients: [] as {token: string | null}[]}));
vi.mock("@clerk/nextjs/server", () => ({auth: mocks.auth}));
vi.mock("next/headers", () => ({headers: mocks.headers}));
vi.mock("convex/browser", () => ({ConvexHttpClient: class {
  token: string | null = null;
  constructor() { mocks.clients.push(this); }
  setAuth(token: string) { this.token = token; }
  async query() { await Promise.resolve(); return this.token; }
}}));
vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud");
const {convexChallenges} = await import("./convex-server");
beforeEach(() => { vi.clearAllMocks(); mocks.clients.length = 0; });

describe("request-scoped database credentials", () => {
  it("keeps concurrent users on separate credentials", async () => {
    mocks.auth.mockResolvedValueOnce({userId: "alice", getToken: async () => "alice-token"})
      .mockResolvedValueOnce({userId: "bob", getToken: async () => "bob-token"});
    const result = await Promise.all([convexChallenges.listByUser("alice"), convexChallenges.listByUser("bob")]);
    expect(result).toEqual(["alice-token", "bob-token"]);
  });
  it("uses cookie identity before a conflicting bearer identity", async () => {
    mocks.auth.mockResolvedValue({userId: "alice", getToken: async () => "alice-token"});
    mocks.headers.mockResolvedValue(new Headers({authorization: "Bearer bob-token"}));
    expect(await convexChallenges.listByUser("alice")).toBe("alice-token");
  });
  it("forwards mobile bearer tokens for verification by Convex", async () => {
    mocks.auth.mockResolvedValue({userId: null});
    mocks.headers.mockResolvedValue(new Headers({authorization: "Bearer mobile-token"}));
    expect(await convexChallenges.listByUser("alice")).toBe("mobile-token");
  });
  it("does not call the database without credentials", async () => {
    mocks.auth.mockResolvedValue({userId: null});
    mocks.headers.mockResolvedValue(new Headers());
    await expect(convexChallenges.listByUser("alice")).rejects.toThrow("Authentication required");
    expect(mocks.clients).toHaveLength(0);
  });
});
