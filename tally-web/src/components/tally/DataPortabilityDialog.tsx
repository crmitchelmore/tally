"use client";

import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";

export function DataPortabilityDialog({ isUserStored = false }: { isUserStored?: boolean }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only query when dialog is open AND user is stored in Convex
  const exportData = useQuery(
    api.import.exportData,
    open && isUserStored && user?.id ? { clerkId: user.id } : "skip"
  );
  const bulkImport = useMutation(api.import.bulkImport);
  const clearAllData = useMutation(api.import.clearAllData);

  const handleExport = () => {
    if (!exportData) return;
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tally-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.challenges || !Array.isArray(data.challenges)) {
        throw new Error("Invalid file format: missing challenges array");
      }

      await bulkImport({
        clerkId: user.id,
        challenges: data.challenges,
        entries: data.entries || [],
      });

      setImportResult({ success: true, message: `Imported ${data.challenges.length} challenges and ${(data.entries || []).length} entries` });
    } catch (error) {
      setImportResult({ success: false, message: error instanceof Error ? error.message : "Import failed" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    await clearAllData({ clerkId: user.id });
    setShowClearConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings & Data</DialogTitle>
          <DialogDescription>
            Export your data, import from a backup, or clear all data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download all your challenges and entries</p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={!exportData}>
              Export
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Import Data</p>
                <p className="text-sm text-gray-500">Restore from a JSON backup file</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>

          {/* Import result */}
          {importResult && (
            <div className={`p-3 rounded-lg text-sm ${
              importResult.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}>
              {importResult.message}
            </div>
          )}

          {/* Clear all */}
          {!showClearConfirm ? (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Clear All Data</p>
                  <p className="text-sm text-red-600">Delete all challenges and entries</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                Clear
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-red-100 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">Are you sure?</p>
              </div>
              <p className="text-sm text-red-700 mb-4">
                This will permanently delete all your challenges and entries. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClearAll}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Everything
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
