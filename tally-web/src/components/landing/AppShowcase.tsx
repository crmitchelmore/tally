"use client";

import { useState } from "react";

const features = [
  {
    id: "challenges",
    title: "Your Challenges",
    description: "See all your goals at a glance with progress bars and pace indicators.",
    mockup: (
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        {[
          { name: "Read 52 books", icon: "📚", progress: 65, count: "34/52" },
          { name: "Run 1000 miles", icon: "🏃", progress: 45, count: "450/1000" },
          { name: "Write daily", icon: "✍️", progress: 88, count: "320/365" },
        ].map((c) => (
          <div key={c.name} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{c.icon}</span>
                <span className="font-medium text-sm">{c.name}</span>
              </div>
              <span className="text-xs text-gray-500">{c.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full"
                style={{ width: `${c.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "stats",
    title: "Detailed Stats",
    description: "Track streaks, averages, and pace to stay motivated.",
    mockup: (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">🔥 23</p>
            <p className="text-xs text-gray-500">Day streak</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold">2.3</p>
            <p className="text-xs text-gray-500">Avg/day</p>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg text-center">
          <p className="text-sm font-medium text-green-700">↑ 5 ahead of pace</p>
          <p className="text-xs text-green-600 mt-1">On track to finish early!</p>
        </div>
      </div>
    ),
  },
  {
    id: "leaderboard",
    title: "Community",
    description: "Make challenges public and compete on the leaderboard.",
    mockup: (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs text-gray-500 mb-3">This Week&apos;s Leaders</p>
        {[
          { rank: "🥇", name: "Sarah K.", score: 847 },
          { rank: "🥈", name: "Marcus T.", score: 723 },
          { rank: "🥉", name: "Jamie L.", score: 698 },
        ].map((u) => (
          <div key={u.name} className="flex items-center justify-between py-2 border-b last:border-0">
            <div className="flex items-center gap-2">
              <span>{u.rank}</span>
              <span className="text-sm">{u.name}</span>
            </div>
            <span className="font-medium text-sm">{u.score}</span>
          </div>
        ))}
      </div>
    ),
  },
];

export function AppShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const current = features.find((f) => f.id === activeFeature);

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful features wrapped in a simple, focused interface
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFeature(f.id)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  activeFeature === f.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <h3 className="font-semibold">{f.title}</h3>
                <p
                  className={`text-sm mt-1 ${
                    activeFeature === f.id ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {f.description}
                </p>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-gray-100 rounded-3xl p-6">
            <div className="bg-gray-800 rounded-2xl p-2 pb-6">
              {/* Phone frame */}
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
                  <span className="text-sm font-medium">{current?.title}</span>
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                </div>
                <div className="p-4">{current?.mockup}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
