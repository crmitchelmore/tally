"use client";

import { useState } from "react";

const features = [
  {
    title: "Log in seconds",
    description:
      "Tap once to add a mark. No menus, no noise—just momentum you can see.",
    detail: "Add entry",
    stat: "+3 marks",
    caption: "Last entry 2 min ago",
  },
  {
    title: "Know your pace",
    description:
      "See if you&apos;re ahead, on pace, or catching up with a calm, honest signal.",
    detail: "Pace status",
    stat: "On pace",
    caption: "3 per day to hit target",
  },
  {
    title: "Sync with confidence",
    description:
      "Offline-first logging with clear sync states across every device.",
    detail: "Sync",
    stat: "Queued → Live",
    caption: "Updates everywhere",
  },
];

function MediaFrame({ feature }: { feature: (typeof features)[number] }) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.3)]">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>{feature.detail}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] text-slate-600">
          Tally
        </span>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Focus streak</p>
          <p className="text-sm font-semibold text-slate-900">{feature.stat}</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-200">
          <div className="h-full w-3/4 rounded-full bg-slate-900/80" />
        </div>
        <p className="mt-3 text-xs text-slate-500">{feature.caption}</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-xs text-slate-500">
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
          Today
          <p className="mt-1 text-sm font-semibold text-slate-900">4</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
          Week
          <p className="mt-1 text-sm font-semibold text-slate-900">19</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
          Month
          <p className="mt-1 text-sm font-semibold text-slate-900">58</p>
        </div>
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="hidden flex-col gap-3 lg:flex">
        {features.map((feature, index) => (
          <button
            key={feature.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`rounded-2xl border px-4 py-4 text-left transition duration-200 motion-reduce:transition-none ${
              activeIndex === index
                ? "border-slate-900/10 bg-white text-slate-900 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.3)]"
                : "border-slate-200/70 bg-transparent text-slate-600 hover:border-slate-300"
            }`}
            aria-pressed={activeIndex === index}
          >
            <h3 className="text-base font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
          </button>
        ))}
      </div>

      <div className="hidden lg:block">
        <MediaFrame feature={features[activeIndex]} />
      </div>

      <div className="space-y-6 lg:hidden">
        {features.map((feature) => (
          <div key={`mobile-${feature.title}`} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
            <MediaFrame feature={feature} />
          </div>
        ))}
      </div>
    </div>
  );
}
