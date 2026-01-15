"use client";

import { useMemo, useState } from "react";

import { useReducedMotion } from "./use-reduced-motion";

const INITIAL_BARS = [2, 4, 3, 5, 2, 4, 3];

function TallyGroup({ marks }: { marks: number }) {
  if (marks <= 0) {
    return null;
  }

  const showSlash = marks >= 5;
  const strokes = Math.min(marks, 4);

  return (
    <div className="relative h-7 w-12">
      {Array.from({ length: strokes }).map((_, index) => (
        <span
          key={index}
          className="absolute bottom-0 top-0 w-[2px] rounded-full bg-slate-900/80"
          style={{ left: 3 + index * 6 }}
        />
      ))}
      {showSlash ? (
        <span className="absolute left-1 top-1 h-[2px] w-12 origin-left rotate-[55deg] rounded-full bg-slate-900/70" />
      ) : null}
    </div>
  );
}

function TallyMarks({ count }: { count: number }) {
  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  const displayGroups = Math.min(groups, 3);

  return (
    <div className="flex items-end gap-2" aria-hidden="true">
      {Array.from({ length: displayGroups }).map((_, index) => (
        <TallyGroup key={`group-${index}`} marks={5} />
      ))}
      {remainder > 0 ? <TallyGroup marks={remainder} /> : null}
      {groups > displayGroups ? (
        <span className="text-xs font-semibold text-slate-500">+{groups - displayGroups}</span>
      ) : null}
    </div>
  );
}

export function HeroDemo() {
  const reducedMotion = useReducedMotion();
  const isInteractive = !reducedMotion;
  const [count, setCount] = useState(12);
  const [bars, setBars] = useState(INITIAL_BARS);

  const paceLabel = useMemo(() => {
    if (count >= 14) {
      return "Ahead of pace";
    }
    if (count >= 12) {
      return "On pace";
    }
    return "Catching up";
  }, [count]);

  const handleAdd = () => {
    setCount((prev) => prev + 1);
    setBars((prev) => {
      const next = [...prev];
      next[next.length - 1] = Math.min(9, next[next.length - 1] + 1);
      return next;
    });
  };

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Today&apos;s tally
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Morning pages</h3>
          <p className="mt-1 text-sm text-slate-500">Target 180 pages • January</p>
        </div>
        <span className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          18 days left
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="text-4xl font-semibold text-slate-900" aria-live="polite">
            {count}
          </p>
          <p className="mt-1 text-sm text-slate-500">marks logged this month</p>
        </div>
        <button
          type="button"
          onClick={isInteractive ? handleAdd : undefined}
          disabled={!isInteractive}
          className="flex h-12 w-16 items-center justify-center rounded-full bg-[#d46b4a] text-lg font-semibold text-white shadow-[0_8px_20px_rgba(212,107,74,0.35)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d46b4a] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
          aria-label="Add one tally mark"
        >
          +1
        </button>
      </div>

      <div className="mt-4">
        <TallyMarks count={count} />
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          This week
        </p>
        <div className="mt-3 flex h-16 items-end gap-2">
          {bars.map((value, index) => (
            <div
              key={`bar-${index}`}
              className="relative flex-1 overflow-hidden rounded-full bg-slate-100"
              aria-hidden="true"
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full bg-slate-900/80 transition-all duration-300 motion-reduce:transition-none"
                style={{ height: `${value * 10 + 8}px` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">{paceLabel}.</span> Keep your pace at
        three pages per day.
      </div>

      {reducedMotion ? (
        <p className="mt-4 text-xs text-slate-400">Reduced motion is on — demo is paused.</p>
      ) : null}
    </div>
  );
}
