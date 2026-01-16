"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormPanel } from "./FormPanel";
import { TimeframeUnit } from "@/types";

// Warm, papery color palette
const COLORS = [
  "#2D6A4F", // forest green
  "#C4410A", // slash red (brand accent)
  "#1A5276", // deep blue
  "#7D3C98", // plum
  "#B9770E", // amber
  "#1F618D", // slate blue
  "#117A65", // teal
  "#6C3483", // purple
];

const ICONS = ["📚", "💪", "🏃", "✍️", "🎯", "💧", "🧘", "🎨", "🎸", "🌱"];

interface CreateChallengeDialogProps {
  onCreated?: () => void;
}

export function CreateChallengeDialog({ onCreated }: CreateChallengeDialogProps) {
  const { user } = useUser();
  const createChallenge = useMutation(api.challenges.create);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: "",
    targetNumber: 100,
    color: COLORS[0],
    icon: ICONS[0],
    timeframeUnit: "year" as TimeframeUnit,
    year: currentYear,
    isPublic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createChallenge({
        clerkId: user.id,
        name: formData.name.trim(),
        targetNumber: formData.targetNumber,
        color: formData.color,
        icon: formData.icon,
        timeframeUnit: formData.timeframeUnit,
        year: formData.year,
        isPublic: formData.isPublic,
      });
      setOpen(false);
      setFormData({
        name: "",
        targetNumber: 100,
        color: COLORS[0],
        icon: ICONS[0],
        timeframeUnit: "year",
        year: currentYear,
        isPublic: false,
      });
      onCreated?.();
    } catch (error) {
      console.error("Failed to create challenge:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn btn-primary">
          + New Challenge
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <FormPanel>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[var(--ink)]">Create Challenge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <label className="stat-label block mb-2">Name</label>
            <input
              className="input"
              placeholder="e.g., Read 50 books"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="stat-label block mb-2">Target</label>
            <input
              className="input"
              type="number"
              min={1}
              value={formData.targetNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetNumber: parseInt(e.target.value) || 1 }))}
              required
            />
          </div>

          <div>
            <label className="stat-label block mb-3">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={`w-11 h-11 text-xl rounded-lg border-2 transition-all ${
                    formData.icon === icon
                      ? "border-[var(--ink)] bg-[var(--paper-warm)] shadow-sm"
                      : "border-[var(--border-light)] hover:border-[var(--border-medium)] bg-white"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="stat-label block mb-3">Color</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-9 h-9 rounded-full transition-all ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-[var(--ink)] scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="stat-label block mb-3">Timeframe</label>
            <div className="flex gap-2">
              {(["year", "month", "custom"] as TimeframeUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, timeframeUnit: unit }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.timeframeUnit === unit
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--paper-warm)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formData.timeframeUnit === "year" && (
            <div>
              <label className="stat-label block mb-2">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) }))}
                className="input"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded border-[var(--border-medium)] text-[var(--ink)] focus:ring-[var(--ink)]"
            />
            <label htmlFor="isPublic" className="text-sm text-[var(--ink-muted)]">
              Make this challenge public
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </button>
          </div>
          </form>
        </FormPanel>
      </DialogContent>
    </Dialog>
  );
}
