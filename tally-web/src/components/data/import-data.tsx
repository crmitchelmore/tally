"use client";

import { useState, useCallback, useRef } from "react";

interface ImportDataProps {
  onImportComplete?: () => void;
}

/**
 * Import user data from JSON file with replace-all semantics.
 * Shows validation errors and import results.
 */
export function ImportData({ onImportComplete }: ImportDataProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    challenges: number;
    entries: number;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".json")) {
        setError("Please select a JSON file");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setResult(null);
      setShowConfirm(true);
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      // Read file content
      const text = await selectedFile.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file");
      }

      // Send to API
      const res = await fetch("/api/v1/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Import failed");
      }

      const importResult = await res.json();
      setResult(importResult.imported);
      setShowConfirm(false);
      setSelectedFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }, [selectedFile, onImportComplete]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-ink">Import Data</h3>
        <p className="text-sm text-muted mt-1">
          Restore from a Tally export file. This will replace all existing data.
        </p>
      </div>

      {!showConfirm ? (
        <div>
          <label
            htmlFor="import-file"
            className="
              inline-flex px-4 py-2.5 rounded-xl border border-border
              text-sm font-medium text-ink
              hover:bg-border/50 transition-colors cursor-pointer
              focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2
            "
          >
            Choose JSON file
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-border bg-paper/50 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                Replace all data?
              </p>
              <p className="text-sm text-muted mt-1">
                Importing will delete all your current challenges, entries, and follows, then restore from{" "}
                <span className="font-medium text-ink">{selectedFile?.name}</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={importing}
              className="
                px-4 py-2 rounded-lg text-sm font-medium text-ink
                hover:bg-border/50 transition-colors
              "
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="
                px-4 py-2 rounded-lg text-sm font-medium
                bg-accent text-white hover:bg-accent/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {importing ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner />
                  Importing...
                </span>
              ) : (
                "Import & Replace"
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm">
          Imported {result.challenges} challenge{result.challenges !== 1 ? "s" : ""} and{" "}
          {result.entries} entr{result.entries !== 1 ? "ies" : "y"} successfully.
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

export default ImportData;
