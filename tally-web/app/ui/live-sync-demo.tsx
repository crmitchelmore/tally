"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SYNC_STATES = [
  {
    label: "Queued",
    detail: "2 marks waiting",
    tone: "queued",
  },
  {
    label: "Syncing",
    detail: "Sending now",
    tone: "syncing",
  },
  {
    label: "Up to date",
    detail: "All marks caught up",
    tone: "done",
  },
];

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

function TallyStack({ count }: { count: number }) {
  return (
    <div className="tally-stack" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => {
        const isSlash = index % 5 === 4;
        return <span key={index} className={isSlash ? "tally-slash" : "tally-line"} />;
      })}
    </div>
  );
}

export function LiveSyncDemo() {
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
      className="live-sync"
      aria-labelledby="live-sync-title"
    >
      <div className="live-sync-heading">
        <p className="live-sync-eyebrow">Live sync demo</p>
        <h2 id="live-sync-title">See every mark arrive, even offline.</h2>
        <p className="live-sync-subhead">
          Queue entries without worry. When you reconnect, Tally syncs calmly
          across devices.
        </p>
      </div>
      <div className="live-sync-grid">
        <div className="live-sync-details">
          <div className="live-sync-states">
            {SYNC_STATES.map((state) => (
              <div key={state.label} className="live-sync-state">
                <span className={`state-dot ${state.tone}`} aria-hidden="true" />
                <div>
                  <p className="state-label">{state.label}</p>
                  <p className="state-detail">{state.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/app" className="live-sync-cta">
            Open the app
          </Link>
        </div>
        <div className="live-sync-visual" aria-label="Sync across devices demo">
          {shouldRenderMedia ? (
            <div className={`sync-panel ${shouldAnimate ? "animate" : ""}`}>
              <div className="sync-device">
                <div className="device-header">
                  <span className="device-title">Phone</span>
                  <span className="device-chip queued">2 queued</span>
                </div>
                <TallyStack count={6} />
                <div className="device-footer">
                  <span className="device-note">Offline notes saved</span>
                </div>
              </div>
              <div className="sync-bridge" aria-hidden="true">
                <span className="bridge-dot" />
              </div>
              <div className="sync-device">
                <div className="device-header">
                  <span className="device-title">Desk</span>
                  <span className="device-chip done">Up to date</span>
                </div>
                <TallyStack count={8} />
                <div className="device-footer">
                  <span className="device-note">Marks synced quietly</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="sync-placeholder" aria-hidden="true" />
          )}
        </div>
      </div>
      <style>{`
        .live-sync {
          width: min(1100px, 100%);
          display: grid;
          gap: 24px;
        }
        .live-sync-heading h2 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .live-sync-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .live-sync-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
        .live-sync-grid {
          display: grid;
          gap: 20px;
        }
        .live-sync-details {
          display: grid;
          gap: 16px;
          align-content: start;
        }
        .live-sync-states {
          display: grid;
          gap: 12px;
        }
        .live-sync-state {
          border-radius: 20px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 14px 16px;
          display: grid;
          grid-template-columns: 14px 1fr;
          gap: 12px;
          align-items: center;
        }
        .state-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #c9c0b2;
        }
        .state-dot.queued {
          background: #b21f24;
        }
        .state-dot.syncing {
          background: #1a1a1a;
        }
        .state-dot.done {
          background: #8b8479;
        }
        .state-label {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
          color: #1a1a1a;
        }
        .state-detail {
          margin: 2px 0 0;
          font-size: 13px;
          color: #6b6b6b;
        }
        .live-sync-cta {
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
        .live-sync-visual {
          display: grid;
        }
        .sync-panel,
        .sync-placeholder {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 20px;
          display: grid;
          gap: 16px;
        }
        .sync-placeholder {
          min-height: 260px;
          background: linear-gradient(120deg, #f4efe7, #efe6da);
        }
        .sync-panel {
          background: #f8f4ee;
        }
        .sync-device {
          border-radius: 20px;
          border: 1px solid #e1d8cc;
          background: #fdfcf9;
          padding: 16px;
          display: grid;
          gap: 12px;
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
        .device-chip.queued {
          border-color: #b21f24;
          color: #b21f24;
        }
        .device-chip.done {
          border-color: #c9c0b2;
          color: #6b6b6b;
        }
        .tally-stack {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 56px;
          padding: 8px 4px 0;
        }
        .tally-line {
          width: 6px;
          height: 46px;
          background: #1a1a1a;
          border-radius: 999px;
          opacity: 0.9;
        }
        .tally-slash {
          width: 38px;
          height: 6px;
          background: #b21f24;
          border-radius: 999px;
          transform: rotate(-18deg);
          margin: 0 4px;
        }
        .device-footer {
          font-size: 12px;
          color: #6b6b6b;
        }
        .sync-bridge {
          justify-self: center;
          width: 2px;
          height: 32px;
          background: #e1d8cc;
          border-radius: 999px;
          position: relative;
        }
        .bridge-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1a1a1a;
          left: 50%;
          transform: translateX(-50%);
          top: 0;
        }
        .sync-panel.animate .bridge-dot {
          animation: sync-flow-vertical 1200ms ease-in-out infinite;
        }
        @keyframes sync-flow-vertical {
          0% {
            opacity: 0.4;
            transform: translate(-50%, 0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
            transform: translate(-50%, 24px);
          }
        }
        @media (min-width: 900px) {
          .live-sync-grid {
            grid-template-columns: minmax(260px, 1fr) minmax(360px, 1.2fr);
            align-items: center;
          }
          .live-sync-heading h2 {
            font-size: 36px;
          }
          .sync-panel {
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
          }
          .sync-bridge {
            width: 64px;
            height: 2px;
          }
          .bridge-dot {
            top: 50%;
            left: 0;
            transform: translate(0, -50%);
          }
          .sync-panel.animate .bridge-dot {
            animation: sync-flow-horizontal 1200ms ease-in-out infinite;
          }
        }
        @keyframes sync-flow-horizontal {
          0% {
            opacity: 0.4;
            transform: translate(0, -50%);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
            transform: translate(48px, -50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sync-panel.animate .bridge-dot {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
