"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Key = {id:string; name:string; prefix:string; scopes:string[]; revokedAt?:number};
export default function APIKeysPage() {
  const [keys,setKeys] = useState<Key[]>([]);
  const [name,setName] = useState("");
  const [read,setRead] = useState(false);
  const [write,setWrite] = useState(false);
  const [secret,setSecret] = useState<string | null>(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function load() {
    const res = await fetch("/api/v1/api-keys",{cache:"no-store"});
    if (!res.ok) throw new Error("Unable to load API keys");
    setKeys((await res.json()).keys);
  }
  useEffect(() => {load().catch(() => setError("Sign in to load your API keys"));},[]);
  async function act(method: "POST" | "DELETE", body: unknown) {
    setBusy(true);setError("");setSecret(null);
    try {
      const res = await fetch("/api/v1/api-keys",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
      if (!res.ok) throw new Error("Request failed");
      const result = await res.json();
      if (method === "POST") setSecret(result.key);
      await load();
    } catch {setError("Request failed. Check your name, scopes and sign-in; maximum 20 active keys.");}
    finally {setBusy(false);}
  }
  return <div className="space-y-6 max-w-2xl mx-auto">
    <Link href="/app/settings">Back to settings</Link><h1 className="text-2xl font-semibold">API keys</h1>
    <p>Keys access only your own challenges. Choose only the permissions your integration needs. Revoke a key immediately if it leaks.</p>
    <form className="space-y-4" onSubmit={e => {e.preventDefault();void act("POST",{name,scopes:[...(read ? ["challenges:read"] : []),...(write ? ["entries:write"] : [])]});}}>
      <label className="block">Integration name <input className="border p-2 text-black" required maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label>
      <label className="block"><input type="checkbox" checked={read} onChange={e => setRead(e.target.checked)} /> Read challenges and their progress</label>
      <label className="block"><input type="checkbox" checked={write} onChange={e => setWrite(e.target.checked)} /> Add entries (requires a stable external event ID)</label>
      <button className="border rounded p-2" disabled={busy || (!read && !write)}>Generate key</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {secret && <section className="border rounded p-4" data-private="true" data-sentry-mask="true"><h2>Copy now — shown only once</h2><p>Store securely; never paste into chat, source control or a URL.</p><code className="break-all ph-no-capture">{secret}</code><button className="block border p-2" onClick={() => setSecret(null)}>I have saved it — hide</button></section>}
    <ul>{keys.map(k => <li className="border rounded p-4 my-2" key={k.id}><strong>{k.name}</strong> · {k.prefix}…<p>{k.scopes.join(", ")}</p>{k.revokedAt ? <span>Revoked</span> : <button disabled={busy} onClick={() => {if (window.confirm(`Revoke ${k.name}?`)) void act("DELETE",{id:k.id});}}>Revoke</button>}</li>)}</ul>
  </div>;
}
