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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { TimeframeUnit } from "@/types";

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

const ICONS = ["🎯", "💪", "📚", "🏃", "💧", "🧘", "✍️", "🎨", "🎸", "💤"];

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
        <Button>
          <Plus className="h-4 w-4" />
          New Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Challenge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Read 50 books"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target</Label>
            <Input
              id="target"
              type="number"
              min={1}
              value={formData.targetNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetNumber: parseInt(e.target.value) || 1 }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  className={`w-10 h-10 text-lg rounded-xl border-2 transition-colors ${
                    formData.icon === icon
                      ? "border-gray-900 bg-gray-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.color === color
                      ? "border-gray-900 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timeframe</Label>
            <div className="flex gap-2">
              {(["year", "month", "custom"] as TimeframeUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, timeframeUnit: unit }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    formData.timeframeUnit === unit
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {formData.timeframeUnit === "year" && (
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) }))}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPublic" className="font-normal">
              Make this challenge public
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
