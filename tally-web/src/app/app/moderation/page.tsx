"use client";

import { useCallback, useEffect, useState } from "react";

type Report = {
  _id: string;
  challengeName: string;
  reason: string;
  detail?: string;
  createdAt: number;
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/moderation", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReports(data.reports);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load reports. Try again.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function resolve(id: string, decision: "removed" | "dismissed") {
    setSaving(id);
    try {
      const response = await fetch("/api/v1/moderation", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action: "resolve", id, decision, note: notes[id]}),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save your decision.");
    } finally { setSaving(null); }
  }
  return <main className="mx-auto max-w-3xl p-6 space-y-6">
    <h1 className="text-3xl font-semibold text-ink">Content review</h1>
    <p className="text-muted">Community sharing is currently unavailable. Reviewing a report keeps the goal private.</p>
    {error && <p role="alert" className="text-accent">{error}</p>}
    {loading ? <p role="status">Loading reports…</p> : !error && reports.length === 0 && <p>No reports waiting for review.</p>}
    <button onClick={() => void load()} className="rounded-lg border border-border px-4 py-2">Refresh</button>
    {reports.map(report => <article key={report._id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <h2 className="text-xl font-medium break-words">{report.challengeName}</h2>
      <p className="text-sm text-muted">{report.reason} · {new Date(report.createdAt).toLocaleDateString()}</p>
      {report.detail && <p className="whitespace-pre-wrap break-words">{report.detail}</p>}
      <label className="block" htmlFor={`note-${report._id}`}>Review note</label>
      <textarea id={`note-${report._id}`} maxLength={1000} value={notes[report._id] ?? ""}
        onChange={event => setNotes({...notes, [report._id]: event.target.value})}
        className="w-full rounded-lg border border-border bg-paper p-3" />
      <div className="flex flex-wrap gap-3">
        {([['removed', 'Remove from community'], ['dismissed', 'Dismiss report']] as const).map(([decision, label]) =>
          <button key={decision} disabled={saving !== null || !notes[report._id]?.trim()}
            onClick={() => void resolve(report._id, decision)}
            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40">{saving === report._id ? "Saving…" : label}</button>)}
      </div>
    </article>)}
  </main>;
}
