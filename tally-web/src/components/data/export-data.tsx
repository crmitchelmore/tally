"use client";

import { useState, useCallback } from "react";

/**
 * Export user data in JSON or CSV format.
 * Follows design philosophy: clear feedback, tactile interaction.
 */
export function ExportData() {
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = useCallback(async (format: "json" | "csv") => {
    setExporting(format);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/v1/data");
      if (!res.ok) throw new Error("Failed to fetch data");

      const data = await res.json();
      const timestamp = new Date().toISOString().split("T")[0];
      
      if (format === "json") {
        // JSON export
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `tally-export-${timestamp}.json`);
      } else {
        // CSV export - challenges and entries as separate sections
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: "text/csv" });
        downloadBlob(blob, `tally-export-${timestamp}.csv`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Export Data</h3>
        <p className="text-sm text-muted mt-1">
          Download all your challenges and entries.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleExport("json")}
          disabled={exporting !== null}
          className="
            px-4 py-2.5 rounded-xl border border-border
            text-sm font-medium text-ink
            hover:bg-border/50 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          "
        >
          {exporting === "json" ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner />
              Exporting...
            </span>
          ) : (
            "Export JSON"
          )}
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={exporting !== null}
          className="
            px-4 py-2.5 rounded-xl border border-border
            text-sm font-medium text-ink
            hover:bg-border/50 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          "
        >
          {exporting === "csv" ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner />
              Exporting...
            </span>
          ) : (
            "Export CSV"
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm">
          Export downloaded successfully.
        </div>
      )}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(data: {
  challenges: Array<{
    id: string;
    name: string;
    target: number;
    timeframeType: string;
    startDate: string;
    endDate: string;
    color: string;
    icon: string;
    isPublic: boolean;
    isArchived: boolean;
    createdAt: string;
  }>;
  entries: Array<{
    id: string;
    challengeId: string;
    date: string;
    count: number;
    note?: string;
    feeling?: string;
    createdAt: string;
  }>;
}): string {
  const lines: string[] = [];

  // Challenges section
  lines.push("# CHALLENGES");
  lines.push(
    "id,name,target,timeframeType,startDate,endDate,color,icon,isPublic,isArchived,createdAt"
  );
  for (const c of data.challenges) {
    lines.push(
      [
        c.id,
        escapeCSV(c.name),
        c.target,
        c.timeframeType,
        c.startDate,
        c.endDate,
        c.color,
        c.icon,
        c.isPublic,
        c.isArchived,
        c.createdAt,
      ].join(",")
    );
  }

  lines.push("");
  lines.push("# ENTRIES");
  lines.push("id,challengeId,date,count,note,feeling,createdAt");
  for (const e of data.entries) {
    lines.push(
      [
        e.id,
        e.challengeId,
        e.date,
        e.count,
        escapeCSV(e.note || ""),
        e.feeling || "",
        e.createdAt,
      ].join(",")
    );
  }

  return lines.join("\n");
}

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default ExportData;
