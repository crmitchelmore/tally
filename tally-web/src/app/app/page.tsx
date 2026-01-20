"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { useState } from "react";

export default function AppPage() {
  const [demoCount, setDemoCount] = useState(0);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="text-center py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Your tallies live here.
        </h1>
        <p className="mt-3 text-base text-muted max-w-md mx-auto">
          Create challenges, log entries, and watch your progress unfold.
        </p>
        <div className="mt-6">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Sign in to start
          </Link>
        </div>
      </section>

      {/* TallyMark demo section */}
      <section className="bg-surface border border-border rounded-2xl p-8 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">
          TallyMark Component Demo
        </h2>
        <p className="text-sm text-muted mb-6">
          Click the button to see the fractal tally system in action.
        </p>

        <div className="flex flex-col items-center gap-6">
          {/* Interactive counter */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setDemoCount(Math.max(0, demoCount - 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-lg font-medium hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Decrease count"
            >
              −
            </button>
            <span className="text-3xl font-semibold text-ink w-16 text-center tabular-nums">
              {demoCount}
            </span>
            <button
              type="button"
              onClick={() => setDemoCount(demoCount + 1)}
              className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-lg font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Increase count"
            >
              +
            </button>
          </div>

          {/* TallyMark display */}
          <div className="min-h-[80px] flex items-center justify-center">
            <TallyMark count={demoCount} size="lg" animated />
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[1, 5, 10, 25, 50, 100, 250, 1000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDemoCount(preset)}
                className="px-3 py-1 text-sm rounded-full border border-border hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Size variants demo */}
      <section className="bg-surface border border-border rounded-2xl p-8 max-w-xl mx-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">Size Variants</h2>
        <div className="flex items-end gap-8 justify-center">
          <div className="text-center">
            <TallyMark count={7} size="sm" />
            <p className="text-xs text-muted mt-2">Small</p>
          </div>
          <div className="text-center">
            <TallyMark count={7} size="md" />
            <p className="text-xs text-muted mt-2">Medium</p>
          </div>
          <div className="text-center">
            <TallyMark count={7} size="lg" />
            <p className="text-xs text-muted mt-2">Large</p>
          </div>
        </div>
      </section>
    </div>
  );
}
