import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({auth:vi.fn(),mutation:vi.fn(),query:vi.fn()}));
vi.mock("@clerk/nextjs/server", () => ({auth:mocks.auth}));
vi.mock("../_lib/convex-server", () => ({authenticatedClient:async () => ({mutation:mocks.mutation,query:mocks.query})}));
import { POST, GET, DELETE } from "./route";
const request = (method:string,body?:unknown,origin="https://tally.example") => new Request("https://tally.example/api/v1/api-keys",{method,headers:{Origin:origin,"Content-Type":"application/json"},body:body ? JSON.stringify(body) : undefined});
describe("owner-authenticated key issuance", () => {
  beforeEach(() => {vi.clearAllMocks();mocks.auth.mockResolvedValue({userId:"alice"});mocks.mutation.mockResolvedValue("key-id");mocks.query.mockResolvedValue([]);});
  it("does not issue or manage keys without signed-in owner", async () => {
    mocks.auth.mockResolvedValue({userId:null});
    expect((await POST(request("POST",{name:"Mobility",scopes:["entries:write"]}))).status).toBe(401);
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await DELETE(request("DELETE",{id:"key-id"}))).status).toBe(401);
    expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("rejects cross-origin and missing-origin writes", async () => {
    expect((await POST(request("POST",{name:"Mobility",scopes:["entries:write"]},"https://evil.example"))).status).toBe(403);
    expect((await DELETE(new Request("https://tally.example/api/v1/api-keys",{method:"DELETE"}))).status).toBe(403);
    expect(mocks.mutation).not.toHaveBeenCalled();
  });
  it("requires explicit scopes and sends only digest to storage", async () => {
    expect((await POST(request("POST",{name:"Mobility",scopes:[]}))).status).toBe(400);
    expect((await POST(request("POST",{name:"Mobility",scopes:["admin"]}))).status).toBe(400);
    const res = await POST(request("POST",{name:"Mobility",scopes:["entries:write"]}));
    expect(res.status).toBe(201);expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json(), stored = mocks.mutation.mock.calls[0][1];
    expect(body.key).toMatch(/^tally_[a-f0-9]{64}$/);
    expect(stored).not.toHaveProperty("key");
    expect(JSON.stringify(stored)).not.toContain(body.key);
    expect(stored.scopes).toEqual(["entries:write"]);
    expect((await GET(request("GET"))).headers.get("Cache-Control")).toBe("no-store");
  });
});
