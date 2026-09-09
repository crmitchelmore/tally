import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { deliver, requestHeaders } = vi.hoisted(() => ({ deliver: vi.fn(), requestHeaders: vi.fn() }));
vi.mock("next/headers", () => ({ headers: requestHeaders }));
vi.mock("posthog-node", () => ({ PostHog: class { captureImmediate = deliver; } }));
describe("server analytics delivery", () => {
  beforeEach(() => {
    vi.resetModules();
    requestHeaders.mockResolvedValue(new Headers());
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-project-key");
    deliver.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it("waits for delivery before the request completes", async () => {
    let finish!: () => void;
    deliver.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const { captureEvent } = await import("./telemetry");
    let completed = false;
    const result = captureEvent("entry_created", { userId: "test-user" }).then(() => { completed = true; });
    await vi.waitFor(() => expect(deliver).toHaveBeenCalledOnce());
    expect(completed).toBe(false);
    expect(deliver).toHaveBeenCalledWith(expect.objectContaining({ distinctId: "test-user", event: "entry_created", properties: expect.objectContaining({ source: "server" }) }));
    finish();
    await result;
    expect(completed).toBe(true);
  });
  it("honours native analytics refusal for server events", async () => {
    requestHeaders.mockResolvedValue(new Headers({ "x-tally-analytics": "disabled" }));
    const { captureEvent } = await import("./telemetry");
    await captureEvent("entry_created", { userId: "test-user" });
    expect(deliver).not.toHaveBeenCalled();
  });
  it("does not turn analytics downtime into a failed user action", async () => {
    deliver.mockRejectedValue(new Error("upstream unavailable"));
    const { captureEvent } = await import("./telemetry");
    await expect(captureEvent("entry_created", { userId: "test-user" })).resolves.toBeUndefined();
  });
  it("excludes native goal and entry content even when analytics is enabled", async () => {
    requestHeaders.mockResolvedValue(new Headers({ "x-tally-analytics": "enabled" }));
    const { captureEvent } = await import("./telemetry");
    await captureEvent("entry_created", { userId: "test-user" }, { entry_count: 25, feeling: "tough", challenge_id: "private-goal" });
    const properties = deliver.mock.calls[0][0].properties;
    expect(properties).not.toHaveProperty("entry_count");
    expect(properties).not.toHaveProperty("feeling");
    expect(properties).not.toHaveProperty("challenge_id");
    expect(properties).toHaveProperty("$geoip_disable", true);
  });
  it("does not send without a configured project", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const { captureEvent } = await import("./telemetry");
    await captureEvent("entry_created", { userId: "test-user" });
    expect(deliver).not.toHaveBeenCalled();
  });
  it("does not combine anonymous API callers into one user", async () => {
    const { captureEvent } = await import("./telemetry");
    await captureEvent("app_opened", {});
    expect(deliver).not.toHaveBeenCalled();
  });
});
