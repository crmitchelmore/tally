"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

export function AppShowcase() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0.2 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = isInView && !prefersReducedMotion;
  const shouldRenderMedia = isInView || hasIntersected;

  return (
    <section
      ref={sectionRef}
      className="app-showcase"
      aria-labelledby="app-showcase-title"
    >
      <div className="app-showcase-heading">
        <p className="app-showcase-eyebrow">App preview</p>
        <h2 id="app-showcase-title">A quiet UI that keeps the ink visible.</h2>
        <p className="app-showcase-subhead">
          Real screens, no gloss. The dashboard stays light, and every challenge
          keeps its pace close.
        </p>
      </div>
      <div className="app-showcase-grid">
        <div className="app-showcase-copy">
          <ul>
            <li>
              <span className="app-showcase-label">Dashboard</span>
              <span>
                Today’s marks, pace, and a gentle queue status in one glance.
              </span>
            </li>
            <li>
              <span className="app-showcase-label">Challenge detail</span>
              <span>Ink tallies and notes stay paired with the goal.</span>
            </li>
          </ul>
          <Link href="/app" className="app-showcase-cta">
            Open the app
          </Link>
        </div>
        <div className="app-showcase-media" aria-label="App screens preview">
          {shouldRenderMedia ? (
            <div className={`app-showcase-stack ${shouldAnimate ? "animate" : ""}`}>
              <div className="app-showcase-device primary">
                <div className="device-header">
                  <span className="device-title">Dashboard</span>
                  <span className="device-chip">Today</span>
                </div>
                <div className="device-metrics">
                  <div>
                    <p className="device-eyebrow">Marks</p>
                    <p className="device-value">6</p>
                  </div>
                  <div className="device-pill">On pace</div>
                </div>
                <div className="device-tallies">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span key={index} className="tally-mark" />
                  ))}
                  <span className="tally-mark slash" />
                  <span className="tally-mark" />
                </div>
                <div className="device-footer">
                  <span className="device-note">Queue: 1 mark</span>
                  <span className="device-note muted">Sync calm</span>
                </div>
              </div>
              <div className="app-showcase-device secondary">
                <div className="device-header">
                  <span className="device-title">Read 20 pages</span>
                  <span className="device-chip muted">Public</span>
                </div>
                <div className="device-progress">
                  <div className="progress-row">
                    <span className="device-eyebrow">Target</span>
                    <span className="progress-value">14 / 20</span>
                  </div>
                  <div className="progress-bar">
                    <span className="progress-fill" />
                  </div>
                </div>
                <div className="device-notes">
                  <span className="note-line" />
                  <span className="note-line short" />
                </div>
                <div className="device-footer">
                  <span className="device-note">Last note: 8:40 pm</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="app-showcase-placeholder" aria-hidden="true" />
          )}
        </div>
      </div>
      <style>{`
        .app-showcase {
          width: min(1100px, 100%);
          display: grid;
          gap: 28px;
        }
        .app-showcase-heading h2 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .app-showcase-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .app-showcase-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
        .app-showcase-grid {
          display: grid;
          gap: 24px;
        }
        .app-showcase-copy {
          display: grid;
          gap: 18px;
          align-content: start;
        }
        .app-showcase-copy ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 14px;
        }
        .app-showcase-copy li {
          border-radius: 18px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 14px 16px;
          display: grid;
          gap: 6px;
          color: #4b4b4b;
          font-size: 14px;
        }
        .app-showcase-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6b6b6b;
        }
        .app-showcase-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          background-color: #1a1a1a;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          width: fit-content;
        }
        .app-showcase-media {
          display: grid;
        }
        .app-showcase-stack,
        .app-showcase-placeholder {
          border-radius: 26px;
          border: 1px solid #e4e1da;
          background: #f8f4ee;
          padding: 20px;
          display: grid;
          gap: 16px;
        }
        .app-showcase-placeholder {
          min-height: 320px;
          background: linear-gradient(120deg, #f4efe7, #efe6da);
        }
        .app-showcase-device {
          border-radius: 20px;
          border: 1px solid #e1d8cc;
          background: #ffffff;
          padding: 16px;
          display: grid;
          gap: 12px;
          box-shadow: 0 18px 30px rgba(20, 20, 20, 0.08);
        }
        .app-showcase-device.secondary {
          background: #fdfcf9;
        }
        .device-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .device-title {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 14px;
        }
        .device-chip {
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .device-chip.muted {
          border-color: #c9c0b2;
          color: #6b6b6b;
        }
        .device-metrics {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .device-eyebrow {
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #6b6b6b;
        }
        .device-value {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .device-pill {
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .device-tallies {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 54px;
          padding: 8px 2px 0;
        }
        .tally-mark {
          width: 6px;
          height: 40px;
          background: #1a1a1a;
          border-radius: 999px;
          opacity: 0.9;
          transform-origin: bottom center;
        }
        .tally-mark.slash {
          width: 36px;
          height: 6px;
          background: #b21f24;
          transform: rotate(-18deg);
          margin: 0 4px 4px;
        }
        .app-showcase-stack.animate .tally-mark {
          animation: ink-rise 420ms ease-out forwards;
        }
        .app-showcase-stack.animate .tally-mark:nth-child(2) {
          animation-delay: 60ms;
        }
        .app-showcase-stack.animate .tally-mark:nth-child(3) {
          animation-delay: 120ms;
        }
        .app-showcase-stack.animate .tally-mark:nth-child(4) {
          animation-delay: 180ms;
        }
        .device-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #6b6b6b;
        }
        .device-note.muted {
          color: #8b8479;
        }
        .device-progress {
          display: grid;
          gap: 10px;
        }
        .progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #4b4b4b;
        }
        .progress-value {
          font-weight: 600;
          color: #1a1a1a;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #efe6da;
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-fill {
          display: block;
          height: 100%;
          width: 70%;
          background: #1a1a1a;
          border-radius: 999px;
        }
        .app-showcase-stack.animate .progress-fill {
          animation: fill-slide 900ms ease-out forwards;
        }
        .device-notes {
          display: grid;
          gap: 6px;
        }
        .note-line {
          height: 8px;
          border-radius: 999px;
          background: #e1d8cc;
        }
        .note-line.short {
          width: 70%;
        }
        @keyframes ink-rise {
          from {
            transform: translateY(6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 0.9;
          }
        }
        @keyframes fill-slide {
          from {
            width: 30%;
          }
          to {
            width: 70%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .app-showcase-stack.animate .tally-mark,
          .app-showcase-stack.animate .progress-fill {
            animation: none;
          }
        }
        @media (min-width: 900px) {
          .app-showcase-grid {
            grid-template-columns: minmax(260px, 0.9fr) minmax(360px, 1.1fr);
            align-items: center;
          }
          .app-showcase-heading h2 {
            font-size: 36px;
          }
          .app-showcase-stack {
            grid-template-columns: 1fr;
          }
          .app-showcase-device.secondary {
            margin-left: 48px;
          }
        }
      `}</style>
    </section>
  );
}
