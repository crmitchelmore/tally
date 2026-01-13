"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Plus, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TallyMarks } from "@/components/tally/TallyMarks";

export function LandingHeroDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(7);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fire confetti on milestones (5, 10, 15)
  const fireCelebration = useCallback(() => {
    if (prefersReducedMotion) return;
    
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ["#C2594A", "#F59E0B", "#FDE047"],
      ticks: 60,
      gravity: 1.2,
      scalar: 0.8,
    });
  }, [prefersReducedMotion]);

  const handleIncrement = useCallback(() => {
    setCount((c) => {
      const next = Math.min(15, c + 1);
      // Celebrate on milestones
      if (next === 5 || next === 10 || next === 15) {
        setShowCelebration(true);
        fireCelebration();
        setTimeout(() => setShowCelebration(false), 1000);
      }
      return next;
    });
  }, [fireCelebration]);

  const week = useMemo(() => {
    // Lightweight, fake “momentum” preview (keeps the demo self-contained).
    const base = Math.max(0, count - 6);
    return Array.from({ length: 7 }, (_, i) => Math.min(12, Math.max(1, base + i) % 12));
  }, [count]);

  return (
    <Card className="relative rounded-2xl shadow-lg overflow-hidden">
      {/* Celebration flash overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 z-10 bg-[color:var(--tally-cross)]/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center justify-between">
          <span>Try it</span>
          <span className="text-xs font-medium text-muted-foreground">click +1</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Today</div>
            <motion.div
              key={count}
              className="geist-mono text-4xl font-bold leading-none"
              style={{ color: "var(--tally-cross)" }}
              initial={prefersReducedMotion ? {} : { scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {count}
            </motion.div>
          </div>
          <div className="flex gap-2">
            <motion.div
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            >
              <Button
                type="button"
                size="sm"
                className="bg-[var(--tally-cross)] text-white hover:opacity-90"
                onClick={handleIncrement}
              >
                <Plus className="h-4 w-4" />
                +1
              </Button>
            </motion.div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCount(0)}
              aria-label="Reset demo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Tally marks</div>
          <div className="min-h-[46px]">
            <TallyMarks
              key={count}
              count={count}
              size="md"
              animate={!prefersReducedMotion}
              color="var(--tally-line)"
              crossColor="var(--tally-cross)"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="mb-3 text-xs font-medium text-muted-foreground">Last 7 days</div>
          <div className="grid h-16 grid-cols-7 items-end gap-1.5">
            {week.map((v, i) => (
              <motion.div
                key={`bar-${i}`}
                className="rounded-sm bg-foreground/10"
                initial={prefersReducedMotion ? { height: `${8 + v * 4}px` } : { height: 0 }}
                animate={{ height: `${8 + v * 4}px` }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: i * 0.05, duration: 0.3, ease: "easeOut" }
                }
                aria-hidden={true}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Small wins compound into momentum.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
