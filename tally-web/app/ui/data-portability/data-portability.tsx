"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const accent = "#b21f24";
const ink = "#1a1a1a";
const surface = "#fdfcf9";
const surfaceEdge = "#e4e1da";
const muted = "#6b6b6b";

type Challenge = {
  id: string;
  name: string;
  targetNumber: number;
  color: string;
  icon: string;
  timeframeUnit: "year" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  year: number;
  isPublic: boolean;
  archived: boolean;
  createdAt: string;
};

type Entry = {
  id: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  feeling?: "very-easy" | "easy" | "moderate" | "hard" | "very-hard";
  sets?: { reps: number }[];
  createdAt: string;
};

type Followed = {
  id: string;
  challengeId: string;
  followedAt: string;
};

type ExportPayload = {
  challenges: Challenge[];
  entries: Entry[];
  followed: Followed[];
};

const backupDate = () => new Date().toISOString().slice(0, 10);

function csvEscape(value: string) {
  if (value.includes('"')) {
    value = value.replace(/"/g, '""');
  }
  if (value.includes(",") || value.includes("\n") || value.includes("\r") || value.includes('"')) {
    return `"${value}"`;
  }
  return value;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

function parseJsonField<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Invalid JSON in ${label}.`);
  }
}

function toCsv(payload: ExportPayload) {
  const rows = [
    "type,id,challengeId,date,count,note,feeling,sets,name,targetNumber,color,icon,timeframeUnit,startDate,endDate,year,isPublic,archived,createdAt,followedAt",
  ];
  payload.challenges.forEach((challenge) => {
    rows.push(
      [
        "challenge",
        challenge.id,
        "",
        "",
        "",
        "",
        "",
        "",
        csvEscape(challenge.name),
        String(challenge.targetNumber),
        csvEscape(challenge.color),
        csvEscape(challenge.icon),
        challenge.timeframeUnit,
        challenge.startDate ?? "",
        challenge.endDate ?? "",
        String(challenge.year),
        String(challenge.isPublic),
        String(challenge.archived),
        challenge.createdAt,
        "",
      ].join(",")
    );
  });
  payload.entries.forEach((entry) => {
    rows.push(
      [
        "entry",
        entry.id,
        entry.challengeId,
        entry.date,
        String(entry.count),
        entry.note ? csvEscape(entry.note) : "",
        entry.feeling ?? "",
        entry.sets ? csvEscape(JSON.stringify(entry.sets)) : "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        entry.createdAt,
        "",
      ].join(",")
    );
  });
  payload.followed.forEach((record) => {
    rows.push(
      [
        "followed",
        record.id,
        record.challengeId,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        record.followedAt,
      ].join(",")
    );
  });
  return rows.join("\n");
}

function fromCsv(text: string): ExportPayload {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rows] = lines;
  if (!headerLine) return { challenges: [], entries: [], followed: [] };
  const header = parseCsvLine(headerLine);
  const columns = [
    "type",
    "id",
    "challengeId",
    "date",
    "count",
    "note",
    "feeling",
    "sets",
    "name",
    "targetNumber",
    "color",
    "icon",
    "timeframeUnit",
    "startDate",
    "endDate",
    "year",
    "isPublic",
    "archived",
    "createdAt",
    "followedAt",
  ];
  const columnIndex = new Map<string, number>();
  columns.forEach((column, index) => {
    const headerIndex = header.indexOf(column);
    columnIndex.set(column, headerIndex >= 0 ? headerIndex : index);
  });
  const getCell = (cells: string[], column: string) => {
    const index = columnIndex.get(column) ?? -1;
    return index >= 0 ? cells[index] ?? "" : "";
  };
  const payload: ExportPayload = { challenges: [], entries: [], followed: [] };
  rows.forEach((row) => {
    if (!row.trim()) return;
    const parts = parseCsvLine(row);
    const type = getCell(parts, "type");
    const id = getCell(parts, "id");
    const challengeId = getCell(parts, "challengeId");
    const date = getCell(parts, "date");
    const count = getCell(parts, "count");
    const note = getCell(parts, "note");
    const feeling = getCell(parts, "feeling");
    const sets = getCell(parts, "sets");
    const name = getCell(parts, "name");
    const targetNumber = getCell(parts, "targetNumber");
    const color = getCell(parts, "color");
    const icon = getCell(parts, "icon");
    const timeframeUnit = getCell(parts, "timeframeUnit");
    const startDate = getCell(parts, "startDate");
    const endDate = getCell(parts, "endDate");
    const year = getCell(parts, "year");
    const isPublic = getCell(parts, "isPublic");
    const archived = getCell(parts, "archived");
    const createdAt = getCell(parts, "createdAt");
    const followedAt = getCell(parts, "followedAt");
    if (type === "challenge") {
      payload.challenges.push({
        id: id || "",
        name: name || "",
        targetNumber: Number(targetNumber),
        color: color || "",
        icon: icon || "",
        timeframeUnit: (timeframeUnit || "year") as Challenge["timeframeUnit"],
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        year: Number(year),
        isPublic: isPublic === "true",
        archived: archived === "true",
        createdAt: createdAt || new Date().toISOString(),
      });
    }
    if (type === "entry") {
      payload.entries.push({
        id: id || "",
        challengeId: challengeId || "",
        date: date || "",
        count: Number(count),
        note: note || undefined,
        feeling: (feeling || undefined) as Entry["feeling"],
        sets: sets ? parseJsonField<{ reps: number }[]>(sets, `entries[${id}].sets`) : undefined,
        createdAt: createdAt || new Date().toISOString(),
      });
    }
    if (type === "followed") {
      payload.followed.push({
        id: id || "",
        challengeId: challengeId || "",
        followedAt: followedAt || new Date().toISOString(),
      });
    }
  });
  return payload;
}

export default function DataPortability() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ExportPayload | null>(null);

  const filenameJson = useMemo(() => `tally-backup-${backupDate()}.json`, []);
  const filenameCsv = useMemo(() => `tally-backup-${backupDate()}.csv`, []);

  const exportData = useCallback(
    async (format: "json" | "csv") => {
      setError(null);
      setStatus(null);
      setBusy(true);
      try {
        const response = await fetch("/api/v1/data/export", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to export data.");
        const payload = (await response.json()) as ExportPayload;
        const blob =
          format === "json"
            ? new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
            : new Blob([toCsv(payload)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = format === "json" ? filenameJson : filenameCsv;
        link.click();
        URL.revokeObjectURL(url);
        setStatus(`Exported ${payload.challenges.length} challenges and ${payload.entries.length} entries.`);
      } catch (exportError) {
        setError(exportError instanceof Error ? exportError.message : "Unable to export data.");
      } finally {
        setBusy(false);
      }
    },
    [filenameJson, filenameCsv]
  );

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      const text = await file.text();
      const data =
        file.type === "text/csv" || file.name.endsWith(".csv")
          ? fromCsv(text)
          : (JSON.parse(text) as ExportPayload);
      setPendingImport(data);
      setConfirmOpen(true);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Unable to read file.");
    } finally {
      setBusy(false);
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!pendingImport) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingImport),
      });
      if (!response.ok) {
        const message = (await response.json()) as { error?: string };
        throw new Error(message.error || "Unable to import data.");
      }
      setStatus("Import complete. All existing data was replaced.");
      setPendingImport(null);
      setConfirmOpen(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import data.");
    } finally {
      setBusy(false);
    }
  }, [pendingImport]);

  const clearAll = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/data/clear", { method: "POST" });
      if (!response.ok) throw new Error("Unable to clear data.");
      setStatus("All data cleared.");
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear data.");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <section
      style={{
        display: "grid",
        gap: "16px",
        borderRadius: "20px",
        border: `1px solid ${surfaceEdge}`,
        padding: "18px",
        background: surface,
      }}
    >
      <header style={{ display: "grid", gap: "6px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: muted,
          }}
        >
          Data portability
        </p>
        <h2 style={{ margin: 0, fontSize: "20px" }}>Export or restore your archive.</h2>
        <p style={{ margin: 0, color: muted }}>
          Save a backup, import a clean copy, or clear everything. Import replaces all existing
          data.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            background: "#fff5f5",
            padding: "12px 16px",
            color: accent,
          }}
        >
          {error}
        </div>
      ) : null}

      {status ? (
        <div
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            background: "#f3f1ec",
            padding: "12px 16px",
            color: ink,
            fontSize: "13px",
          }}
        >
          {status}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => exportData("json")}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "999px",
              border: `1px solid ${ink}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            disabled={busy}
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => exportData("csv")}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            disabled={busy}
          >
            Export CSV
          </button>
        </div>
        <div
          style={{
            borderRadius: "16px",
            border: `1px dashed ${surfaceEdge}`,
            padding: "14px",
            display: "grid",
            gap: "10px",
          }}
        >
          <p style={{ margin: 0, color: muted }}>
            Import a backup (JSON or CSV). We will replace everything currently stored.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {pendingImport ? (
            <p style={{ margin: 0, color: muted, fontSize: "12px" }}>
              Ready to import {pendingImport.challenges.length} challenges and{" "}
              {pendingImport.entries.length} entries.
            </p>
          ) : null}
        </div>
        <div
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            padding: "14px",
            display: "grid",
            gap: "8px",
            background: "#fff5f5",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Clear everything</p>
          <p style={{ margin: 0, fontSize: "13px", color: muted }}>
            This removes challenges, entries, and follows. There is no undo.
          </p>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              color: accent,
              fontWeight: 600,
              cursor: "pointer",
              width: "fit-content",
            }}
            disabled={busy}
          >
            Clear all data
          </button>
        </div>
      </div>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(16, 16, 16, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              borderRadius: "24px",
              background: "#ffffff",
              padding: "20px",
              border: `1px solid ${surfaceEdge}`,
              display: "grid",
              gap: "12px",
            }}
          >
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              {pendingImport ? "Replace all data?" : "Clear all data?"}
            </p>
            <p style={{ margin: 0, color: muted }}>
              {pendingImport
                ? "Importing will wipe existing challenges, entries, and follows before restoring this backup."
                : "This will remove every challenge, entry, and follow record tied to your account."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingImport(null);
                }}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  border: `1px solid ${surfaceEdge}`,
                  background: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingImport) {
                    void confirmImport();
                  } else {
                    void clearAll();
                    setConfirmOpen(false);
                  }
                }}
                style={{
                  height: "36px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: accent,
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                disabled={busy}
              >
                {pendingImport ? "Replace data" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
