import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({query:vi.fn(),mutation:vi.fn(),auth:vi.fn()}));
vi.mock("@clerk/nextjs/server", () => ({auth:mocks.auth}));
vi.mock("convex/browser", () => ({ConvexHttpClient:class {query=mocks.query;mutation=mocks.mutation;}}));
vi.mock("@/lib/telemetry", () => ({generateRequestId:vi.fn(),withSpan:vi.fn(),captureEvent:vi.fn()}));
vi.stubEnv("NEXT_PUBLIC_CONVEX_URL","https://example.convex.cloud");
const { GET } = await import("../challenges/route");
const { POST } = await import("../entries/route");
import { generateKey, digestKey } from "./api-key";
import { ConvexError } from "convex/values";
function req(path:string,method:string,key:string,body?:unknown) {return new Request(`https://tally.example/api/v1/${path}`,{method,headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:body ? JSON.stringify(body):undefined}) as NextRequest;}
beforeEach(() => {vi.clearAllMocks();});
describe("capability REST dispatch", () => {
  it("uses the key, not an ambient session, and preserves challenge response shape",async () => {
    const {key}=generateKey();mocks.query.mockResolvedValue([]);
    const response = await GET(req("challenges","GET",key));
    expect(response.status).toBe(200);expect(await response.json()).toEqual({challenges:[]});
    expect(mocks.query.mock.calls[0][1]).toEqual({digest:digestKey(key),includeArchived:false});
    expect(mocks.auth).not.toHaveBeenCalled();expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("requires event IDs, returns replay/conflict status, and never forwards the plaintext key", async () => {
    const {key}=generateKey(), body={challengeId:"goal",date:"2026-01-01",count:1};
    expect((await POST(req("entries","POST",key,body))).status).toBe(400);
    mocks.mutation.mockResolvedValue({entry:{id:"entry"},replayed:true});
    expect((await POST(req("entries","POST",key,{...body,externalEventId:"provider:event"}))).status).toBe(200);
    expect(mocks.mutation.mock.calls[0][1].digest).toBe(digestKey(key));
    expect(JSON.stringify(mocks.mutation.mock.calls[0][1])).not.toContain(key);
    mocks.mutation.mockRejectedValue(new ConvexError({code:"EVENT_CONFLICT"}));
    expect((await POST(req("entries","POST",key,{...body,externalEventId:"provider:event"}))).status).toBe(409);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("maps invalid and insufficient-scope failures without exposing backend details",async () => {
    mocks.query.mockRejectedValue(new ConvexError({code:"UNAUTHORIZED"}));
    expect((await GET(req("challenges","GET","tally_invalid"))).status).toBe(401);
    mocks.query.mockRejectedValue(new ConvexError({code:"FORBIDDEN"}));
    expect((await GET(req("challenges","GET",generateKey().key))).status).toBe(403);
  });
});
