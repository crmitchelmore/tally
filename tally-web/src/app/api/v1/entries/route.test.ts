import { it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({createEntry:vi.fn()}));
vi.mock("../_lib/auth", () => ({requireAuth:async () => ({userId:"owner"}),isAuthError:() => false}));
vi.mock("../_lib/store", () => ({getEntriesByChallenge:vi.fn(),getEntriesByUser:vi.fn(),getChallengeById:async () => ({userId:"owner"}),getUserByClerkId:async () => null,createEntry:mocks.createEntry}));
vi.mock("@/lib/telemetry", () => ({generateRequestId:() => "test",withSpan:(_n:unknown,_a:unknown,fn:Function) => fn({setAttribute:vi.fn()}),captureEvent:vi.fn()}));
import { POST } from "./route";
it("preserves Android simple-count submissions with explicit null sets",async () => {
  mocks.createEntry.mockResolvedValue({id:"entry",challengeId:"goal",count:1});
  const response=await POST(new Request("https://tally.example/api/v1/entries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({challengeId:"goal",date:"2026-01-01",count:1,note:"",feeling:"okay",sets:null})}) as NextRequest);
  expect(response.status).toBe(201);
  expect(mocks.createEntry.mock.calls[0][1].sets).toBeUndefined();
});
