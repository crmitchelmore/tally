import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { authenticatedClient } from "../_lib/convex-server";
import { generateKey } from "../_lib/api-key";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
const response = (body: unknown, status = 200) => NextResponse.json(body, {status, headers:{"Cache-Control":"no-store", "Pragma":"no-cache"}});
async function authorize(request: Request, write = false) {
  if (!(await auth()).userId) return response({error:"Sign in to manage API keys"},401);
  if (write && request.headers.get("origin") !== new URL(request.url).origin) return response({error:"Same-origin request required"},403);
  return null;
}
export async function GET(request: Request) {
  const denied = await authorize(request); if (denied) return denied;
  try { return response({keys:await (await authenticatedClient()).query(api.apiKeys.list,{})}); }
  catch { return response({error:"Unable to load keys"},500); }
}
export async function POST(request: Request) {
  const denied = await authorize(request,true); if (denied) return denied;
  try {
    const body = await request.json();
    if (!body || typeof body.name !== "string" || !body.name.trim() || body.name.length > 80 || !Array.isArray(body.scopes) || !body.scopes.length || body.scopes.some((s:unknown) => s !== "challenges:read" && s !== "entries:write")) return response({error:"Choose a name and explicit scopes"},400);
    const {key, digest, prefix} = generateKey();
    const id = await (await authenticatedClient()).mutation(api.apiKeys.create,{name:body.name,digest,prefix,scopes:body.scopes});
    return response({id,key,prefix},201);
  } catch { return response({error:"Unable to create key"},400); }
}
export async function DELETE(request: Request) {
  const denied = await authorize(request,true); if (denied) return denied;
  try {
    const body = await request.json();
    if (typeof body?.id !== "string") return response({error:"Key ID required"},400);
    await (await authenticatedClient()).mutation(api.apiKeys.revoke,{id:body.id as Id<"apiKeys">});
    return response({revoked:true});
  } catch { return response({error:"Unable to revoke key"},403); }
}
