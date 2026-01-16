"use client";

import { useState } from "react";

export function LiveSyncDemo() {
  const [count, setCount] = useState(42);
  const [syncing, setSyncing] = useState(false);
  const [devices, setDevices] = useState([
    { name: "Web", synced: true },
    { name: "iPhone", synced: true },
    { name: "Android", synced: true },
  ]);

  const handleIncrement = () => {
    setCount(c => c + 1);
    setSyncing(true);
    
    // Simulate sync delay
    setDevices(d => d.map(dev => ({ ...dev, synced: false })));
    
    setTimeout(() => {
      setDevices(d => [{ ...d[0], synced: true }, ...d.slice(1)]);
    }, 200);
    
    setTimeout(() => {
      setDevices(d => [d[0], { ...d[1], synced: true }, d[2]]);
    }, 400);
    
    setTimeout(() => {
      setDevices(d => d.map(dev => ({ ...dev, synced: true })));
      setSyncing(false);
    }, 600);
  };

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Instant sync everywhere
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Log on any device. See updates in real-time across all your devices.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Demo area */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 mb-2">Push-ups this year</p>
              <p className="text-6xl font-bold text-gray-900 tabular-nums">{count}</p>
              <button
                onClick={handleIncrement}
                className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                + Add one
              </button>
            </div>

            {/* Device sync status */}
            <div className="border-t pt-6">
              <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-wide">
                {syncing ? "Syncing..." : "Synced across"}
              </p>
              <div className="flex justify-center gap-8">
                {devices.map((device) => (
                  <div key={device.name} className="text-center">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-2 transition-colors ${
                        device.synced
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      {device.name === "Web" && "💻"}
                      {device.name === "iPhone" && "📱"}
                      {device.name === "Android" && "🤖"}
                    </div>
                    <p className="text-xs text-gray-600">{device.name}</p>
                    <p className="text-xs text-gray-400">
                      {device.synced ? count : count - 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
