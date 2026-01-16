"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { Feeling } from "@/types";

const FEELINGS: { value: Feeling; label: string; emoji: string }[] = [
  { value: "very-easy", label: "Very Easy", emoji: "😊" },
  { value: "easy", label: "Easy", emoji: "🙂" },
  { value: "moderate", label: "Moderate", emoji: "😐" },
  { value: "hard", label: "Hard", emoji: "😓" },
  { value: "very-hard", label: "Very Hard", emoji: "😤" },
];

interface AddEntrySheetProps {
  challengeId?: Id<"challenges">;
  onAdded?: () => void;
  trigger?: React.ReactNode;
}

export function AddEntrySheet({ challengeId, onAdded, trigger }: AddEntrySheetProps) {
  const { user } = useUser();
  const createEntry = useMutation(api.entries.create);
  const challenges = useQuery(
    api.challenges.listActive,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  
  const [formData, setFormData] = useState({
    challengeId: challengeId || ("" as Id<"challenges"> | ""),
    date: today,
    count: 1,
    note: "",
    feeling: undefined as Feeling | undefined,
  });

  // Auto-select challenge if only one exists and no challengeId provided
  useEffect(() => {
    if (!challengeId && challenges?.length === 1) {
      setFormData((prev) => ({ ...prev, challengeId: challenges[0]._id }));
    }
  }, [challenges, challengeId]);

  // Reset challengeId when provided as prop
  useEffect(() => {
    if (challengeId) {
      setFormData((prev) => ({ ...prev, challengeId }));
    }
  }, [challengeId]);

  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.challengeId) return;

    setIsSubmitting(true);
    try {
      await createEntry({
        clerkId: user.id,
        challengeId: formData.challengeId as Id<"challenges">,
        date: formData.date,
        count: formData.count,
        note: formData.note || undefined,
        feeling: formData.feeling,
      });
      
      // Show confetti if motion is allowed
      if (!prefersReducedMotion) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setOpen(false);
      setFormData({
        challengeId: challengeId || "",
        date: today,
        count: 1,
        note: "",
        feeling: undefined,
      });
      onAdded?.();
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementCount = () => setFormData((prev) => ({ ...prev, count: prev.count + 1 }));
  const decrementCount = () => setFormData((prev) => ({ ...prev, count: Math.max(1, prev.count - 1) }));

  const selectedChallenge = challenges?.find((c) => c._id === formData.challengeId);

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50">
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Entry</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {!challengeId && (
              <div className="space-y-2">
                <Label>Challenge</Label>
                <div className="grid grid-cols-2 gap-2">
                  {challenges?.map((challenge) => (
                    <button
                      key={challenge._id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, challengeId: challenge._id }))}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        formData.challengeId === challenge._id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{challenge.icon}</span>
                        <span className="font-medium text-sm truncate">{challenge.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedChallenge && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: selectedChallenge.color + "20" }}
                >
                  {selectedChallenge.icon}
                </div>
                <div>
                  <p className="font-medium">{selectedChallenge.name}</p>
                  <p className="text-sm text-gray-500">Target: {selectedChallenge.targetNumber}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Count</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrementCount}
                  disabled={formData.count <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={formData.count}
                  onChange={(e) => setFormData((prev) => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="w-20 text-center text-2xl font-bold"
                />
                <Button type="button" variant="outline" size="icon" onClick={incrementCount}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                max={today}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>How did it feel?</Label>
              <div className="flex justify-between">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ 
                      ...prev, 
                      feeling: prev.feeling === feeling.value ? undefined : feeling.value 
                    }))}
                    className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                      formData.feeling === feeling.value
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                    title={feeling.label}
                  >
                    <span className="text-2xl">{feeling.emoji}</span>
                    <span className="text-xs text-gray-500 mt-1">{feeling.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder="Add a note..."
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !formData.challengeId}
            >
              {isSubmitting ? "Adding..." : "Add Entry"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
