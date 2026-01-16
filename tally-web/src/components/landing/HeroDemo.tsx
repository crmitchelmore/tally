"use client";

import { useState } from "react";

export function HeroDemo() {
  const [count, setCount] = useState(47);
  const [isPressed, setIsPressed] = useState(false);
  
  const target = 100;
  const progress = (count / target) * 100;
  
  const handleAdd = () => {
    setIsPressed(true);
    setCount(c => Math.min(c + 1, target));
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div 
        className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg"
        role="region"
        aria-label="Interactive demo"
      >
        {/* Challenge header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-100">
              📚
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Read 100 Books</h3>
              <p className="text-sm text-emerald-600">Ahead</p>
            </div>
          </div>
          
          {/* Add button */}
          <button
            onClick={handleAdd}
            className={`w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all ${isPressed ? 'scale-95' : 'scale-100'}`}
            aria-label="Add one to count"
          >
            +
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{count} / {target}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">349</p>
            <p className="text-xs text-gray-500">Days left</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">0.15</p>
            <p className="text-xs text-gray-500">Per day</p>
          </div>
        </div>
        
        {/* Tap hint */}
        <p className="text-center text-sm text-gray-400 mt-4 animate-pulse">
          Tap + to try it
        </p>
      </div>
    </div>
  );
}
