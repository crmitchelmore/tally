"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ExportData } from "./export-data";
import { ImportData } from "./import-data";
import { ClearData } from "./clear-data";

interface DataManagementSectionProps {
  onDataChange?: () => void;
}

/**
 * Data management section for the settings/profile area.
 * Progressive disclosure: primary action is export, secondary actions behind toggle.
 */
export function DataManagementSection({ onDataChange }: DataManagementSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDataChange = useCallback(() => {
    onDataChange?.();
  }, [onDataChange]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          px-4 py-2 rounded-xl border border-border
          text-sm font-medium text-ink
          hover:bg-border/50 transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        "
      >
        Manage Data
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) handleClose();
        }}
        className="
          fixed inset-0 z-[1300] m-auto p-0
          w-full max-w-lg max-h-[90vh]
          bg-transparent backdrop:bg-ink/40 backdrop:backdrop-blur-sm
          open:animate-dialog-in
        "
      >
        <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold text-ink">Manage Your Data</h2>
            <button
              type="button"
              onClick={handleClose}
              className="
                w-8 h-8 rounded-full flex items-center justify-center
                text-muted hover:text-ink hover:bg-border/50
                transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
              "
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
            <ExportData />
            
            <div className="border-t border-border pt-6">
              <ImportData onImportComplete={handleDataChange} />
            </div>
            
            <div className="border-t border-border pt-6">
              <ClearData onClearComplete={handleDataChange} />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

export default DataManagementSection;
