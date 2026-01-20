"use client";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { memo, useState, useCallback } from "react";

/**
 * Hero Micro-Demo
 *
 * Interactive challenge card that demonstrates the core loop:
 * - Click +1 to add a tally mark
 * - Ink-stroke animation draws each mark (pencil-like)
 * - 5th stroke is the signature red diagonal slash
 * - Mini progress bar updates
 *
 * Design: tactile, honest, no gimmicks (no emoji/confetti)
 * Performance: lightweight, hydrates after render, no heavy charts
 */

interface TallyStroke {
  id: number;
  isSlash: boolean;
  animating: boolean;
}

export const HeroMicroDemo = memo(function HeroMicroDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);
  const [strokes, setStrokes] = useState<TallyStroke[]>([]);
  const maxCount = 25;

  const handleIncrement = useCallback(() => {
    if (count >= maxCount) return;

    const newCount = count + 1;
    const isSlash = newCount % 5 === 0;
    const newStroke: TallyStroke = {
      id: newCount,
      isSlash,
      animating: !prefersReducedMotion,
    };

    setCount(newCount);
    setStrokes((prev) => [...prev, newStroke]);

    // Clear animation state after completion
    if (!prefersReducedMotion) {
      setTimeout(() => {
        setStrokes((prev) =>
          prev.map((s) => (s.id === newCount ? { ...s, animating: false } : s))
        );
      }, 300);
    }
  }, [count, prefersReducedMotion, maxCount]);

  const handleReset = useCallback(() => {
    setCount(0);
    setStrokes([]);
  }, []);

  // Group strokes into 5-gates for rendering
  const fiveGates: TallyStroke[][] = [];
  for (let i = 0; i < strokes.length; i += 5) {
    fiveGates.push(strokes.slice(i, i + 5));
  }

  const progress = (count / maxCount) * 100;

  return (
    <div className="hero-demo" role="region" aria-label="Interactive demo">
      {/* Demo challenge card */}
      <div className="demo-card">
        {/* Card header */}
        <div className="demo-card-header">
          <span className="demo-challenge-name">Daily pushups</span>
          <span className="demo-target">
            {count} / {maxCount}
          </span>
        </div>

        {/* Tally marks display */}
        <div
          className="demo-tally-area"
          aria-live="polite"
          aria-label={`${count} tally marks`}
        >
          {fiveGates.map((gate, gateIdx) => (
            <FiveGateGroup key={gateIdx} strokes={gate} />
          ))}
          {strokes.length === 0 && (
            <span className="demo-placeholder">Tap +1 to add a mark</span>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="demo-progress-track"
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={maxCount}
        >
          <div
            className="demo-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action buttons */}
        <div className="demo-actions">
          <button
            type="button"
            className="demo-add-btn"
            onClick={handleIncrement}
            disabled={count >= maxCount}
            aria-label="Add one tally mark"
          >
            <span className="demo-add-icon" aria-hidden="true">
              +
            </span>
            <span>1</span>
          </button>
          {count > 0 && (
            <button
              type="button"
              className="demo-reset-btn"
              onClick={handleReset}
              aria-label="Reset demo"
            >
              Reset
            </button>
          )}
        </div>

        {/* Completion message */}
        {count >= maxCount && (
          <p className="demo-complete-msg">Challenge complete!</p>
        )}
      </div>
    </div>
  );
});

/**
 * Five-gate group: up to 4 vertical strokes + optional diagonal slash
 */
function FiveGateGroup({ strokes }: { strokes: TallyStroke[] }) {
  const verticalStrokes = strokes.filter((s) => !s.isSlash);
  const slash = strokes.find((s) => s.isSlash);

  return (
    <div className="demo-gate" aria-hidden="true">
      {/* Vertical strokes */}
      {verticalStrokes.map((stroke) => (
        <TallyStrokeElement key={stroke.id} stroke={stroke} />
      ))}
      {/* Diagonal slash (positioned over strokes) */}
      {slash && <TallySlashElement stroke={slash} />}
    </div>
  );
}

/**
 * Single vertical stroke with ink-draw animation
 */
function TallyStrokeElement({ stroke }: { stroke: TallyStroke }) {
  return (
    <span
      className={`demo-stroke ${stroke.animating ? "demo-stroke-animating" : ""}`}
    />
  );
}

/**
 * Diagonal slash (5th stroke) with ink-draw animation
 */
function TallySlashElement({ stroke }: { stroke: TallyStroke }) {
  return (
    <span
      className={`demo-slash ${stroke.animating ? "demo-slash-animating" : ""}`}
    />
  );
}

export default HeroMicroDemo;
