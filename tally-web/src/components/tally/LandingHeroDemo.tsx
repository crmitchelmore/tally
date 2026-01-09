"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TallyMarks } from "@/components/tally/TallyMarks";

export function LandingHeroDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(7);

  const week = useMemo(() => {
    // Lightweight, fake “momentum” preview (keeps the demo self-contained).
    const base = Math.max(0, count - 6);
    return Array.from({ length: 7 }, (_, i) => Math.min(12, Math.max(1, base + i) % 12));
  }, [count]);

  return (
    <Card className="rounded-2xl shadow-lg">
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
            <div
              className="geist-mono text-4xl font-bold leading-none"
              style={{ color: "var(--tally-cross)" }}
            >
              {count}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-[var(--tally-cross)] text-white hover:opacity-90"
              onClick={() => setCount((c) => Math.min(15, c + 1))}
            >
              <Plus className="h-4 w-4" />
              +1
            </Button>
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
              <div
                key={i}
                className="rounded-sm bg-foreground/10"
                style={{ height: `${8 + v * 4}px` }}
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
