"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";

// Pre-computed sparkle positions - generated at module load time to satisfy React purity rules
const SPARKLE_POSITIONS = Array.from({ length: 12 }).map((_, i) => ({
  // Use deterministic but visually varied positions based on index
  x: 20 + ((i * 17 + 7) % 60),
  y: 20 + ((i * 23 + 11) % 60),
}));

interface SuccessCelebrationProps {
  /** Whether to trigger the celebration */
  trigger: boolean;
  /** Type of celebration */
  type?: "confetti" | "sparkle" | "pulse" | "tally";
  /** Duration of the celebration in ms */
  duration?: number;
  /** Callback when celebration ends */
  onComplete?: () => void;
}

/**
 * Success celebration component that fires confetti or other visual effects.
 * Respects reduced motion preferences.
 */
export function SuccessCelebration({
  trigger,
  type = "confetti",
  duration = 2000,
  onComplete,
}: SuccessCelebrationProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasTriggered = useRef(false);

  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion) return;

    // Fire confetti from both sides
    const defaults = {
      spread: 60,
      ticks: 100,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#C2594A", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.2, y: 0.6 },
      angle: 60,
    });

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { x: 0.8, y: 0.6 },
      angle: 120,
    });
  }, [prefersReducedMotion]);

  const fireTallyConfetti = useCallback(() => {
    if (prefersReducedMotion) return;

    // Tally-themed confetti (warm colors)
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C2594A", "#F59E0B", "#FDE047"],
      ticks: 100,
      gravity: 1,
      decay: 0.92,
      startVelocity: 25,
      shapes: ["square", "circle"],
    });
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;

      if (type === "confetti") {
        fireConfetti();
      } else if (type === "tally") {
        fireTallyConfetti();
      }

      const timer = setTimeout(() => {
        onComplete?.();
        hasTriggered.current = false;
      }, duration);

      return () => clearTimeout(timer);
    }

    if (!trigger) {
      hasTriggered.current = false;
    }
  }, [trigger, type, duration, fireConfetti, fireTallyConfetti, onComplete]);

  // Sparkle animation overlay (for reduced motion or as alternative)
  if (type === "sparkle" && trigger) {
    return (
      <AnimatePresence>
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {SPARKLE_POSITIONS.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-[color:var(--tally-cross)]"
              initial={{
                x: "50vw",
                y: "50vh",
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${pos.x}vw`,
                y: `${pos.y}vh`,
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Pulse animation (minimal, good for reduced motion)
  if (type === "pulse" && trigger) {
    return (
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 bg-[color:var(--tally-cross)]/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.4 }}
      />
    );
  }

  return null;
}

interface MilestoneToastProps {
  /** Whether to show the toast */
  show: boolean;
  /** Milestone type */
  type: "streak" | "target" | "record" | "first";
  /** Milestone value */
  value: number;
  /** Label for the milestone */
  label: string;
  /** Callback when toast is dismissed */
  onDismiss?: () => void;
}

/**
 * Animated toast notification for milestones and achievements.
 */
export function MilestoneToast({
  show,
  type,
  value,
  label,
  onDismiss,
}: MilestoneToastProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  const icons = {
    streak: "🔥",
    target: "🎯",
    record: "🏆",
    first: "✨",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.1 }
              : { type: "spring", damping: 20, stiffness: 300 }
          }
        >
          <div className="flex items-center gap-3 rounded-full border bg-card px-5 py-3 shadow-lg">
            <span className="text-2xl" role="img" aria-label={type}>
              {icons[type]}
            </span>
            <div>
              <div className="text-lg font-bold">{value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
