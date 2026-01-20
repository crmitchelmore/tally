"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TimeframeType, CreateChallengeRequest } from "@/app/api/v1/_lib/types";

export interface CreateChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeRequest) => Promise<void>;
}

const PRESET_COLORS = [
  "#FF4747", // Tally red (default)
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6B7280", // Gray
];

const PRESET_ICONS = [
  { value: "tally", label: "Tally" },
  { value: "run", label: "Running" },
  { value: "book", label: "Reading" },
  { value: "pen", label: "Writing" },
  { value: "code", label: "Code" },
  { value: "music", label: "Music" },
  { value: "heart", label: "Health" },
  { value: "star", label: "Goal" },
];

/**
 * Modal dialog for creating a new challenge.
 * Follows design philosophy: minimal inputs, strong defaults, fast feedback.
 */
export function CreateChallengeDialog({ open, onClose, onSubmit }: CreateChallengeDialogProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [timeframeType, setTimeframeType] = useState<TimeframeType>("year");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("tally");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Manage dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      nameInputRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setName("");
      setTarget("");
      setTimeframeType("year");
      setCustomStart("");
      setCustomEnd("");
      setColor(PRESET_COLORS[0]);
      setIcon("tally");
      setIsPublic(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data: CreateChallengeRequest = {
        name: name.trim(),
        target: parseInt(target, 10),
        timeframeType,
        color,
        icon,
        isPublic,
      };

      if (timeframeType === "custom") {
        data.startDate = customStart;
        data.endDate = customEnd;
      }

      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create challenge");
    } finally {
      setSubmitting(false);
    }
  }, [name, target, timeframeType, customStart, customEnd, color, icon, isPublic, onSubmit, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="
        fixed inset-0 m-auto p-0
        w-full max-w-lg max-h-[90vh]
        bg-surface border border-border rounded-2xl shadow-lg
        backdrop:bg-ink/50
        overflow-hidden
      "
      aria-labelledby="create-challenge-title"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 id="create-challenge-title" className="text-lg font-semibold text-ink">
            New Challenge
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-border/50 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="challenge-name" className="block text-sm font-medium text-ink mb-1.5">
              Name
            </label>
            <input
              ref={nameInputRef}
              id="challenge-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push-ups 2026"
              className="
                w-full px-3 py-2.5 rounded-lg
                bg-paper border border-border
                text-ink placeholder:text-muted/60
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              "
            />
          </div>

          {/* Target */}
          <div>
            <label htmlFor="challenge-target" className="block text-sm font-medium text-ink mb-1.5">
              Target
            </label>
            <input
              id="challenge-target"
              type="number"
              required
              min={1}
              max={1000000}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., 10000"
              className="
                w-full px-3 py-2.5 rounded-lg
                bg-paper border border-border
                text-ink placeholder:text-muted/60 tabular-nums
                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              "
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Timeframe</label>
            <div className="flex gap-2">
              {(["year", "month", "custom"] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframeType(tf)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium
                    border transition-colors
                    ${timeframeType === tf
                      ? "bg-accent text-white border-accent"
                      : "bg-paper border-border text-ink hover:bg-border/50"
                    }
                  `}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            {timeframeType === "custom" && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="custom-start" className="block text-xs text-muted mb-1">
                    Start
                  </label>
                  <input
                    id="custom-start"
                    type="date"
                    required
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="
                      w-full px-3 py-2 rounded-lg text-sm
                      bg-paper border border-border text-ink
                      focus:outline-none focus:ring-2 focus:ring-accent
                    "
                  />
                </div>
                <div>
                  <label htmlFor="custom-end" className="block text-xs text-muted mb-1">
                    End
                  </label>
                  <input
                    id="custom-end"
                    type="date"
                    required
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                    className="
                      w-full px-3 py-2 rounded-lg text-sm
                      bg-paper border border-border text-ink
                      focus:outline-none focus:ring-2 focus:ring-accent
                    "
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-transform
                    ${color === c ? "border-ink scale-110" : "border-transparent hover:scale-105"}
                  `}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => setIcon(i.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm border transition-colors
                    ${icon === i.value
                      ? "bg-accent text-white border-accent"
                      : "bg-paper border-border text-ink hover:bg-border/50"
                    }
                  `}
                  aria-pressed={icon === i.value}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${isPublic ? "bg-accent" : "bg-border"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow
                  transition-transform
                  ${isPublic ? "translate-x-5" : ""}
                `}
              />
            </button>
            <label className="text-sm text-ink">Make this challenge public</label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink hover:bg-border/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !target}
            className="
              px-5 py-2 rounded-lg text-sm font-medium
              bg-accent text-white
              hover:bg-accent/90 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {submitting ? "Creating..." : "Create Challenge"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default CreateChallengeDialog;
