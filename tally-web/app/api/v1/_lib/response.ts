import { NextResponse } from "next/server";
import { applyTraceHeaders } from "./telemetry";

export function jsonOk(data: unknown, status = 200) {
  return applyTraceHeaders(NextResponse.json(data, { status }));
}

export function jsonError(message: string, status = 400) {
  return applyTraceHeaders(NextResponse.json({ error: message }, { status }));
}
