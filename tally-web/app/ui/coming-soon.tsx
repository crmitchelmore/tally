"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StoreCard = {
  label: string;
  detail: string;
};

type ComingSoonProps = {
  platform: string;
  headline: string;
  subhead: string;
  cards: StoreCard[];
  deviceNote: string;
};

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

export function ComingSoonPage({
  platform,
  headline,
  subhead,
  cards,
  deviceNote,
}: ComingSoonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const inkMarks = useMemo(() => Array.from({ length: 5 }), []);

  return (
    <main className="coming-soon">
      <section className="coming-soon-hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">{platform} app</p>
          <h1>{headline}</h1>
          <p className="hero-subhead">{subhead}</p>
          <div className="hero-cta">
            <Link href="/app" className="primary-cta">
              Open the web app
            </Link>
            <Link href="/" className="secondary-cta">
              Back to landing
            </Link>
          </div>
        </div>
        <div className="hero-preview" aria-label={`${platform} preview`}>
          <div className="preview-header">
            <span className="preview-label">{platform} preview</span>
            <span className="preview-chip">Coming soon</span>
          </div>
          <div
            className={`preview-ink ${prefersReducedMotion ? "" : "animate"}`}
            aria-hidden="true"
          >
            {inkMarks.map((_, index) => (
              <span
                key={index}
                className={index === 4 ? "ink-slash" : "ink-line"}
              />
            ))}
          </div>
          <div className="preview-footer">
            <span className="preview-note">{deviceNote}</span>
            <span className="preview-note muted">Offline-ready</span>
          </div>
        </div>
      </section>
      <section className="store-panel" aria-labelledby="store-title">
        <div className="store-heading">
          <p className="store-eyebrow">Get notified</p>
          <h2 id="store-title">Stores are opening soon.</h2>
          <p className="store-subhead">
            We are polishing the ink and syncing flows. In the meantime, the web
            app is ready to tally.
          </p>
        </div>
        <div className="store-grid">
          {cards.map((card) => (
            <article key={card.label} className="store-card">
              <div>
                <p className="store-label">{card.label}</p>
                <p className="store-detail">{card.detail}</p>
              </div>
              <span className="store-placeholder" aria-disabled="true">
                Coming soon
              </span>
            </article>
          ))}
        </div>
      </section>
      <style>{`
        .coming-soon {
          min-height: 100vh;
          padding: 64px 24px 96px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 72px;
          background: linear-gradient(
            180deg,
            rgba(247, 247, 245, 1) 0%,
            rgba(241, 238, 232, 1) 100%
          );
        }
        .coming-soon-hero,
        .store-panel {
          width: min(1100px, 100%);
          display: grid;
          gap: 32px;
        }
        .hero-copy h1 {
          margin: 0;
          font-size: 40px;
          line-height: 1.1;
        }
        .hero-eyebrow,
        .store-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .hero-subhead,
        .store-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
        .hero-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
        }
        .primary-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          background-color: #b21f24;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
        }
        .secondary-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid #d9d2c8;
          color: #1a1a1a;
          text-decoration: none;
          font-weight: 600;
          background: #fdfcf9;
        }
        .hero-preview {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 24px;
          display: grid;
          gap: 18px;
          box-shadow: 0 18px 30px rgba(20, 20, 20, 0.08);
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .preview-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6b6b6b;
        }
        .preview-chip {
          border-radius: 999px;
          border: 1px solid #1a1a1a;
          padding: 4px 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1a1a1a;
          font-weight: 600;
          background: #ffffff;
        }
        .preview-ink {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          min-height: 60px;
          padding: 8px 4px 0;
        }
        .ink-line {
          width: 6px;
          height: 46px;
          background: #1a1a1a;
          border-radius: 999px;
          opacity: 0.9;
          transform-origin: bottom center;
        }
        .ink-slash {
          width: 42px;
          height: 6px;
          background: #b21f24;
          border-radius: 999px;
          transform: rotate(-18deg);
          margin: 0 6px;
        }
        .preview-ink.animate .ink-line {
          animation: ink-rise 420ms ease-out forwards;
        }
        .preview-ink.animate .ink-line:nth-child(2) {
          animation-delay: 60ms;
        }
        .preview-ink.animate .ink-line:nth-child(3) {
          animation-delay: 120ms;
        }
        .preview-ink.animate .ink-line:nth-child(4) {
          animation-delay: 180ms;
        }
        .preview-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #6b6b6b;
        }
        .preview-note.muted {
          color: #8b8479;
        }
        .store-panel h2 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .store-grid {
          display: grid;
          gap: 16px;
        }
        .store-card {
          border-radius: 20px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .store-label {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .store-detail {
          margin: 6px 0 0;
          font-size: 13px;
          color: #6b6b6b;
        }
        .store-placeholder {
          border-radius: 999px;
          border: 1px dashed #c9c0b2;
          padding: 6px 12px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #8b8479;
          font-weight: 600;
          background: #f5f1ea;
        }
        @keyframes ink-rise {
          from {
            transform: translateY(8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 0.9;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .preview-ink.animate .ink-line {
            animation: none;
          }
        }
        @media (min-width: 900px) {
          .coming-soon-hero {
            grid-template-columns: minmax(320px, 1fr) minmax(320px, 0.9fr);
            align-items: center;
          }
          .store-panel {
            grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
            align-items: start;
          }
          .hero-copy h1 {
            font-size: 46px;
          }
          .store-panel h2 {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  );
}
