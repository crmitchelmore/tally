"use client";

import { useEffect, useMemo, useState } from "react";

const MAX_COUNT = 12;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function TallyMarks({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const groups = Math.ceil(count / 5);
  const totalWidth = groups * 74;
  const height = 70;

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      role="img"
      aria-label={`Tally marks showing ${count} entries`}
    >
      <defs>
        <filter id="ink">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            seed="3"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.6" />
        </filter>
      </defs>
      {Array.from({ length: count }).map((_, index) => {
        const groupIndex = Math.floor(index / 5);
        const offset = groupIndex * 74;
        const local = index % 5;
        const isSlash = local === 4;
        const strokeColor = isSlash ? "#b21f24" : "#1a1a1a";
        const baseDelay = reducedMotion ? "0ms" : `${index * 70}ms`;

        if (isSlash) {
          return (
            <line
              key={`slash-${index}`}
              x1={offset + 8}
              y1={10}
              x2={offset + 64}
              y2={60}
              stroke={strokeColor}
              strokeWidth={5}
              strokeLinecap="round"
              filter="url(#ink)"
              style={{
                opacity: reducedMotion ? 1 : 0,
                animation: reducedMotion
                  ? "none"
                  : `tally-draw 240ms ease-out ${baseDelay} forwards`,
              }}
            />
          );
        }

        return (
          <line
            key={`line-${index}`}
            x1={offset + 8 + local * 12}
            y1={8}
            x2={offset + 8 + local * 12}
            y2={62}
            stroke={strokeColor}
            strokeWidth={5}
            strokeLinecap="round"
            filter="url(#ink)"
            style={{
              opacity: reducedMotion ? 1 : 0,
              animation: reducedMotion
                ? "none"
                : `tally-draw 220ms ease-out ${baseDelay} forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes tally-draw {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const width = 180;
  const height = 56;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} role="img" aria-label="Pace trend">
      <polyline
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {values.map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * (height - 8) - 4;
        return (
          <circle key={index} cx={x} cy={y} r={3} fill="#b21f24" />
        );
      })}
    </svg>
  );
}

export function HeroDemo() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [count, setCount] = useState(4);

  const trend = useMemo(() => {
    return [1, 2, 3, 3, 4, Math.min(count, 6), 6];
  }, [count]);

  const handleIncrement = () => {
    setCount((prev) => (prev >= MAX_COUNT ? 1 : prev + 1));
  };

  return (
    <div
      style={{
        width: "min(420px, 100%)",
        borderRadius: "24px",
        border: "1px solid #e4e1da",
        backgroundColor: "#fdfcf9",
        padding: "24px",
        boxShadow: "0 24px 64px rgba(20, 20, 20, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6b6b6b",
            }}
          >
            Daily tally
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "28px", fontWeight: 600 }}>
            {count} entries
          </p>
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          style={{
            height: "44px",
            minWidth: "96px",
            borderRadius: "999px",
            border: "1px solid #1a1a1a",
            backgroundColor: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
          aria-label="Add one tally entry"
        >
          +1
        </button>
      </div>
      <div
        style={{
          background: "#f5f1ea",
          borderRadius: "16px",
          padding: "12px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <TallyMarks count={count} reducedMotion={prefersReducedMotion} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#6b6b6b",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Pace
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
            Steady
          </p>
        </div>
        <Sparkline values={trend} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#6b6b6b",
        }}
      >
        Tap +1 to feel the ink-like rhythm. No account needed.
      </p>
    </div>
  );
}
