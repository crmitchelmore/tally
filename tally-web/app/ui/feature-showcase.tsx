"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Feature = {
  id: "log" | "pace" | "sync";
  title: string;
  description: string;
  highlights: string[];
  tag: string;
  mediaTitle: string;
  mediaNote: string;
};

const FEATURES: Feature[] = [
  {
    id: "log",
    title: "Log in a breath",
    description:
      "Tap once to capture today, or batch a week without losing your place.",
    highlights: ["Ink-like marks arrive instantly", "Notes stay close to each mark"],
    tag: "Daily logging",
    mediaTitle: "Daily tally",
    mediaNote: "Quick taps, tangible marks.",
  },
  {
    id: "pace",
    title: "See momentum, not pressure",
    description:
      "Pace and streaks are calm signals, so you always know where you stand.",
    highlights: ["Weekly pace in a single glance", "No penalty for rest days"],
    tag: "Progress signals",
    mediaTitle: "Weekly rhythm",
    mediaNote: "Momentum over motivation.",
  },
  {
    id: "sync",
    title: "Quiet sync states",
    description:
      "Stay offline without worry and see exactly what is waiting to sync.",
    highlights: ["Clear queued counts", "Sync stays calm and visible"],
    tag: "Offline-first",
    mediaTitle: "Sync status",
    mediaNote: "Offline is a first-class mode.",
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

function TallyGlyph() {
  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 18 12"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="2" y1="1" x2="2" y2="11" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="6" y1="1" x2="6" y2="11" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="10" y1="1" x2="10" y2="11" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="14" y1="1" x2="14" y2="11" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="3" y1="2" x2="15" y2="10" stroke="#b21f24" strokeWidth="2" />
    </svg>
  );
}

function MediaPlaceholder() {
  return <div className="showcase-placeholder" aria-hidden="true" />;
}

function FeatureMedia({ id, animate }: { id: Feature["id"]; animate: boolean }) {
  switch (id) {
    case "log":
      return (
        <div className={`showcase-media-frame ${animate ? "animate" : ""}`}>
          <div className="media-top">
            <div>
              <p className="media-eyebrow">Daily tally</p>
              <p className="media-value">7 marks</p>
            </div>
            <span className="media-chip">On pace</span>
          </div>
          <div className="media-tallies">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="ink-stroke" />
            ))}
            <span className="ink-stroke slash" />
            {Array.from({ length: 2 }).map((_, index) => (
              <span key={`tail-${index}`} className="ink-stroke" />
            ))}
          </div>
          <div className="media-bottom">
            <span className="media-label">Tap +1 to add</span>
            <span className="media-pill">+1</span>
          </div>
        </div>
      );
    case "pace":
      return (
        <div className={`showcase-media-frame ${animate ? "animate" : ""}`}>
          <div className="media-top">
            <div>
              <p className="media-eyebrow">Weekly rhythm</p>
              <p className="media-value">Steady</p>
            </div>
            <span className="media-chip muted">Ahead</span>
          </div>
          <div className="media-bars">
            {[20, 34, 30, 46, 38, 48, 40].map((value, index) => (
              <span
                key={index}
                className="media-bar"
                style={{ height: `${value}px` }}
              />
            ))}
          </div>
          <div className="media-bottom">
            <span className="media-label">7 of 10 for the week</span>
            <TallyGlyph />
          </div>
        </div>
      );
    default:
      return (
        <div className={`showcase-media-frame ${animate ? "animate" : ""}`}>
          <div className="media-top">
            <div>
              <p className="media-eyebrow">Sync status</p>
              <p className="media-value">Quiet sync</p>
            </div>
            <span className="media-chip muted">2 queued</span>
          </div>
          <div className="media-sync">
            <div className="media-sync-row">
              <span className="sync-dot offline" />
              <span>Offline notes saved</span>
            </div>
            <div className="media-sync-row">
              <span className="sync-dot queued" />
              <span>2 marks queued</span>
            </div>
            <div className="media-sync-row">
              <span className="sync-dot live" />
              <span>Ready to sync</span>
            </div>
            <div className="sync-line" />
          </div>
          <div className="media-bottom">
            <span className="media-label">Back online in seconds</span>
            <TallyGlyph />
          </div>
        </div>
      );
  }
}

export function FeatureShowcase() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeId, setActiveId] = useState<Feature["id"]>("log");
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

  const activeFeature = useMemo(
    () => FEATURES.find((feature) => feature.id === activeId) ?? FEATURES[0],
    [activeId]
  );

  const shouldAnimate = isInView && !prefersReducedMotion;
  const shouldRenderMedia = isInView || hasIntersected;

  return (
    <section
      ref={sectionRef}
      className="showcase"
      aria-labelledby="feature-showcase-title"
    >
      <div className="showcase-heading">
        <p className="showcase-eyebrow">Feature focus</p>
        <h2 id="feature-showcase-title">Designed for calm momentum.</h2>
        <p className="showcase-subhead">
          A focused set of tools that keep the tally moving without turning it
          into noise.
        </p>
      </div>
      <div className="showcase-cta">
        <Link href="/app">Open the app</Link>
      </div>
      <div className="showcase-mobile">
        {FEATURES.map((feature) => (
          <article key={feature.id} className="showcase-card">
            <div className="showcase-card-media">
              {shouldRenderMedia ? (
                <FeatureMedia id={feature.id} animate={shouldAnimate} />
              ) : (
                <MediaPlaceholder />
              )}
            </div>
            <div className="showcase-card-body">
              <div className="showcase-card-tag">
                <TallyGlyph />
                <span>{feature.tag}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul>
                {feature.highlights.map((highlight) => (
                  <li key={highlight}>
                    <TallyGlyph />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <div className="showcase-desktop">
        <div className="showcase-list" role="list">
          {FEATURES.map((feature) => {
            const isActive = feature.id === activeId;
            return (
              <button
                key={feature.id}
                type="button"
                className={`showcase-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveId(feature.id)}
                onMouseEnter={() => setActiveId(feature.id)}
                aria-pressed={isActive}
              >
                <div className="showcase-item-header">
                  <div className="showcase-item-tag">
                    <TallyGlyph />
                    <span>{feature.tag}</span>
                  </div>
                  <span className="showcase-item-title">{feature.title}</span>
                </div>
                <p className="showcase-item-desc">{feature.description}</p>
                {isActive ? (
                  <ul className="showcase-item-highlights">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight}>
                        <TallyGlyph />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="showcase-media">
          {shouldRenderMedia ? (
            <FeatureMedia id={activeFeature.id} animate={shouldAnimate} />
          ) : (
            <MediaPlaceholder />
          )}
          <div className="showcase-media-caption">
            <span>{activeFeature.mediaTitle}</span>
            <span>{activeFeature.mediaNote}</span>
          </div>
        </div>
      </div>
      <style>{`
        .showcase {
          width: min(1100px, 100%);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .showcase-heading h2 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .showcase-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .showcase-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
        .showcase-cta a {
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
        .showcase-mobile {
          display: grid;
          gap: 20px;
        }
        .showcase-card {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          overflow: hidden;
          display: grid;
          gap: 18px;
        }
        .showcase-card-media {
          padding: 20px;
          background: #f5f1ea;
        }
        .showcase-card-body {
          padding: 0 20px 20px;
          display: grid;
          gap: 12px;
        }
        .showcase-card-body h3 {
          margin: 0;
          font-size: 22px;
        }
        .showcase-card-body p {
          margin: 0;
          color: #4b4b4b;
        }
        .showcase-card-body ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .showcase-card-body li,
        .showcase-item-highlights li {
          display: grid;
          grid-template-columns: 20px 1fr;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #3f3f3f;
        }
        .showcase-card-tag,
        .showcase-item-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .showcase-desktop {
          display: none;
        }
        .showcase-list {
          display: grid;
          gap: 12px;
        }
        .showcase-item {
          border-radius: 20px;
          border: 1px solid transparent;
          background: transparent;
          text-align: left;
          padding: 18px;
          display: grid;
          gap: 10px;
          cursor: pointer;
          transition: border 150ms ease, background 150ms ease,
            box-shadow 150ms ease;
        }
        .showcase-item.active {
          border-color: #e1d8cc;
          background: #f8f4ee;
          box-shadow: 0 16px 30px rgba(20, 20, 20, 0.08);
        }
        .showcase-item-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .showcase-item-desc {
          margin: 0;
          color: #4b4b4b;
          font-size: 14px;
        }
        .showcase-item-highlights {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .showcase-media {
          display: grid;
          gap: 16px;
          align-content: start;
        }
        .showcase-media-caption {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #6b6b6b;
        }
        .showcase-media-caption span:first-child {
          color: #1a1a1a;
          font-weight: 600;
        }
        .showcase-media-frame,
        .showcase-placeholder {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 22px;
          min-height: 260px;
          display: grid;
          gap: 16px;
        }
        .showcase-placeholder {
          background: linear-gradient(120deg, #f4efe7, #efe6da);
        }
        .media-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .media-eyebrow {
          margin: 0;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6b6b6b;
        }
        .media-value {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 600;
        }
        .media-chip {
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .media-chip.muted {
          border-color: #c9c0b2;
          color: #6b6b6b;
        }
        .media-tallies {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 12px 6px 4px;
          min-height: 64px;
        }
        .ink-stroke {
          width: 6px;
          height: 48px;
          background: #1a1a1a;
          border-radius: 999px;
          transform-origin: bottom center;
          opacity: 0.9;
        }
        .ink-stroke.slash {
          width: 46px;
          height: 6px;
          background: #b21f24;
          transform: rotate(-18deg);
          margin: 0 6px;
        }
        .showcase-media-frame.animate .ink-stroke {
          animation: tally-rise 420ms ease-out forwards;
        }
        .showcase-media-frame.animate .ink-stroke:nth-child(2) {
          animation-delay: 60ms;
        }
        .showcase-media-frame.animate .ink-stroke:nth-child(3) {
          animation-delay: 120ms;
        }
        .showcase-media-frame.animate .ink-stroke:nth-child(4) {
          animation-delay: 180ms;
        }
        .media-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 10px 4px 0;
          min-height: 64px;
        }
        .media-bar {
          width: 12px;
          background: #1a1a1a;
          border-radius: 999px;
          opacity: 0.85;
        }
        .showcase-media-frame.animate .media-bar {
          animation: bar-rise 420ms ease-out forwards;
        }
        .media-sync {
          display: grid;
          gap: 10px;
          font-size: 14px;
          color: #4b4b4b;
        }
        .media-sync-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sync-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #c9c0b2;
        }
        .sync-dot.offline {
          background: #1a1a1a;
        }
        .sync-dot.queued {
          background: #b21f24;
        }
        .sync-dot.live {
          background: #8b8479;
        }
        .sync-line {
          height: 1px;
          background: #e1d8cc;
          width: 80%;
        }
        .showcase-media-frame.animate .sync-line {
          animation: sync-pulse 600ms ease-in-out infinite;
        }
        .media-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #6b6b6b;
          font-size: 13px;
        }
        .media-pill {
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          padding: 6px 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        @keyframes tally-rise {
          from {
            transform: translateY(6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 0.9;
          }
        }
        @keyframes bar-rise {
          from {
            transform: scaleY(0.6);
            opacity: 0.4;
          }
          to {
            transform: scaleY(1);
            opacity: 0.85;
          }
        }
        @keyframes sync-pulse {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 0.3;
          }
        }
        @media (min-width: 900px) {
          .showcase-mobile {
            display: none;
          }
          .showcase-desktop {
            display: grid;
            grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.1fr);
            gap: 32px;
            align-items: start;
          }
          .showcase-heading h2 {
            font-size: 36px;
          }
        }
      `}</style>
    </section>
  );
}
