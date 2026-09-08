"use client";
import { useState } from "react";
import { useUser, SignInButton, useClerk } from "@clerk/nextjs";
import Link from "next/link";
export default function DeleteAccount() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function remove() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/v1/account", { method: "DELETE" });
      if (!response.ok) throw new Error("We could not finish deleting your account. Please try again or contact support.");
      setDone(true);
      await signOut();
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-xl px-6 py-16 space-y-6">
    <Link href="/">← Tally</Link><h1 className="text-3xl font-semibold">Delete your Tally account</h1>
    {done ? <p role="status">Your account and cloud data have been deleted. Clear any offline data from Settings on your other devices.</p> : <>
      <p>This permanently deletes your sign-in account, profile, challenges, entries, follows and saved preferences, including items in Trash. This cannot be undone. Export anything you want to keep from Settings first.</p>
      <p>Offline copies on other devices must be cleared on those devices. Store purchase records and essential security or backup records may be retained where needed. Contact support to request removal of historical analytics associated with your account.</p>
      {!isLoaded ? <p>Loading…</p> : !isSignedIn ? <><p>Sign in to confirm which account to delete.</p><SignInButton mode="modal"><button className="rounded-xl bg-accent text-white px-5 py-3">Sign in</button></SignInButton></> : <>
        <label className="block">Type DELETE to confirm<input className="mt-2 block w-full rounded-lg border border-border bg-surface p-3" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label>
        <button disabled={confirmation !== "DELETE" || busy} onClick={remove} className="rounded-xl bg-red-700 text-white px-5 py-3 disabled:opacity-50">{busy ? "Deleting…" : "Permanently delete account"}</button>
      </>}{error && <p role="alert">{error}</p>}
    </>}<p><Link href="/support" className="underline">Contact support</Link> · <Link href="/privacy" className="underline">Privacy policy</Link></p>
  </main>;
}
