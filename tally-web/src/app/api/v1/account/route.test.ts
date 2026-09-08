import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireAuth: vi.fn(), mutate: vi.fn(), deleteUser: vi.fn(), setAuth: vi.fn(), getToken: vi.fn() }));
vi.mock("../_lib/auth", () => ({ requireAuth: mocks.requireAuth, isAuthError: (value: {response?: unknown}) => !!value.response }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({getToken: mocks.getToken}), clerkClient: async () => ({users:{deleteUser:mocks.deleteUser}}) }));
vi.mock("convex/browser", () => ({ ConvexHttpClient: class { setAuth = mocks.setAuth; mutation = mocks.mutate; } }));
import { DELETE } from "./route";

describe("permanent account deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://test.convex.cloud");
    mocks.requireAuth.mockResolvedValue({userId:"owned-account"});
    mocks.getToken.mockResolvedValue("owned-session");
    mocks.mutate.mockResolvedValue({success:true});
    mocks.deleteUser.mockResolvedValue({});
  });
  it("does not touch data for unauthenticated callers", async () => {
    mocks.requireAuth.mockResolvedValue({response:new Response(null,{status:401})});
    expect((await DELETE(new Request("https://tally-tracker.app/api/v1/account",{method:"DELETE"}))).status).toBe(401);
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
  it("rejects cross-origin deletion requests", async () => {
    const response = await DELETE(new Request("https://tally-tracker.app/api/v1/account",{method:"DELETE", headers:{Origin:"https://example.invalid"}}));
    expect(response.status).toBe(403);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it("uses the verified session and account, ignoring arbitrary body IDs", async () => {
    const response = await DELETE(new Request("https://tally-tracker.app/api/v1/account", {method:"DELETE",body:JSON.stringify({userId:"other-account"})}));
    expect(response.status).toBe(200);
    expect(mocks.setAuth).toHaveBeenCalledWith("owned-session");
    expect(mocks.mutate).toHaveBeenCalledWith(expect.anything(),{});
    expect(mocks.deleteUser).toHaveBeenCalledWith("owned-account");
    expect(mocks.mutate.mock.invocationCallOrder[0]).toBeLessThan(mocks.deleteUser.mock.invocationCallOrder[0]);
  });
  it("keeps authentication available for a retry when data deletion fails", async () => {
    mocks.mutate.mockRejectedValue(new Error("database unavailable"));
    expect((await DELETE(new Request("https://tally-tracker.app/api/v1/account", {method:"DELETE"}))).status).toBe(500);
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
