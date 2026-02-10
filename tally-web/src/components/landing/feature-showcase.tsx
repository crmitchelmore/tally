"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TallyDisplay } from "@/components/ui/tally-display";

const features = [
  {
    id: "track",
    title: "Track anything",
    description:
      "Push-ups, pages read, kilometres run, guitar practice — set a target and log progress with satisfying tally marks. Your pace, your rules.",
  },
  {
    id: "progress",
    title: "See real progress",
    description:
      "Activity heatmaps, streaks, and burn-up charts. Know instantly if you're ahead, on pace, or behind — without judgement.",
  },
  {
    id: "sync",
    title: "Sync everywhere",
    description:
      "Works offline, syncs the moment you're connected. Web, iOS, and Android — your data follows you across every device.",
  },
  {
    id: "community",
    title: "Share with others",
    description:
      "Make challenges public for accountability. Follow friends, discover new goals, and cheer each other on.",
  },
] as const;

type FeatureId = (typeof features)[number]["id"];

function FeatureIcon({ index, isActive }: { index: number; isActive: boolean }) {
  const strokeCount = Math.min(index + 1, 4);
  const hasSlash = index >= 4;
  return (
    <div className="feature-icon" aria-hidden="true" style={{ opacity: isActive ? 1 : 0.4, transition: "opacity 150ms ease" }}>
      {Array.from({ length: strokeCount }).map((_, i) => (
        <span key={i} className="feature-icon-stroke" />
      ))}
      {hasSlash && <span className="feature-icon-slash" />}
    </div>
  );
}

/** Live visual for each feature — replaces the old placeholder */
function FeatureVisual({ featureId }: { featureId: FeatureId }) {
  if (featureId === "track") {
    return (
      <div className="fv-track" aria-hidden="true">
        <div className="fv-card">
          <div className="fv-card-row">
            <TallyDisplay count={5} size="sm" />
            <div className="fv-card-text">
              <span className="fv-card-title">Morning Run</span>
              <span className="fv-card-sub">156 / 200 km</span>
            </div>
          </div>
          <div className="fv-progress"><div className="fv-progress-fill" style={{ width: "78%" }} /></div>
        </div>
        <div className="fv-card">
          <div className="fv-card-row">
            <TallyDisplay count={3} size="sm" />
            <div className="fv-card-text">
              <span className="fv-card-title">Read 30 Pages</span>
              <span className="fv-card-sub">712 / 900 pp</span>
            </div>
          </div>
          <div className="fv-progress"><div className="fv-progress-fill secondary" style={{ width: "79%" }} /></div>
        </div>
        <div className="fv-card">
          <div className="fv-card-row">
            <TallyDisplay count={2} size="sm" />
            <div className="fv-card-text">
              <span className="fv-card-title">Learn Guitar</span>
              <span className="fv-card-sub">18 / 60 hrs</span>
            </div>
          </div>
          <div className="fv-progress"><div className="fv-progress-fill" style={{ width: "30%" }} /></div>
        </div>
      </div>
    );
  }

  if (featureId === "progress") {
    // Mini heatmap + streak + pace
    const heatCells = [0,2,3,1,0,3,2, 1,3,2,0,1,2,3, 2,1,3,3,2,0,1, 3,2,1,3,2,3,0, 1,0,2,3,1,2,0];
    return (
      <div className="fv-progress-visual" aria-hidden="true">
        <div className="fv-streak-row">
          <span className="fv-streak-badge">🔥 23-day streak</span>
          <span className="fv-pace-pill fv-pace-ahead">↑ 3d ahead</span>
        </div>
        <div className="fv-heatmap">
          {heatCells.map((v, i) => (
            <span key={i} className={`fv-heatmap-cell fv-heat-${v}`} />
          ))}
        </div>
        <div className="fv-mini-chart">
          {[60,85,40,95,70,100,50].map((h, i) => (
            <div key={i} className={`fv-mini-bar${i === 6 ? " active" : ""}`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (featureId === "sync") {
    return (
      <div className="fv-sync" aria-hidden="true">
        <div className="fv-device">
          <div className="fv-device-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
          </div>
          <span className="fv-device-label">iPhone</span>
          <span className="fv-device-count">156 km</span>
          <span className="fv-sync-pill fv-synced">● Synced</span>
        </div>
        <div className="fv-sync-arrow">⇄</div>
        <div className="fv-device">
          <div className="fv-device-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <span className="fv-device-label">Web</span>
          <span className="fv-device-count">156 km</span>
          <span className="fv-sync-pill fv-synced">● Synced</span>
        </div>
      </div>
    );
  }

  // community
  return (
    <div className="fv-community" aria-hidden="true">
      <div className="fv-public-card">
        <span className="fv-avatar fv-avatar-pink">E</span>
        <div className="fv-public-text">
          <span className="fv-public-name">Draw Every Day</span>
          <span className="fv-public-sub">@studio.lina · 289/365</span>
        </div>
      </div>
      <div className="fv-public-card">
        <span className="fv-avatar fv-avatar-blue">M</span>
        <div className="fv-public-text">
          <span className="fv-public-name">100 Cold Plunges</span>
          <span className="fv-public-sub">@marcus_t · 67/100</span>
        </div>
      </div>
      <div className="fv-public-card">
        <span className="fv-avatar fv-avatar-green">S</span>
        <div className="fv-public-text">
          <span className="fv-public-name">Learn Mandarin</span>
          <span className="fv-public-sub">@polyglot_sam · 142/365</span>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({
  feature, index, isActive, onSelect,
}: {
  feature: (typeof features)[number]; index: number; isActive: boolean; onSelect: () => void;
}) {
  return (
    <div className={`accordion-item ${isActive ? "accordion-item-active" : ""}`}>
      <button className="accordion-trigger" onClick={onSelect} aria-expanded={isActive} aria-controls={`panel-${feature.id}`}>
        <FeatureIcon index={index} isActive={isActive} />
        <span className="accordion-title">{feature.title}</span>
        <span className="accordion-arrow" aria-hidden="true">{isActive ? "−" : "+"}</span>
      </button>
      <div
        id={`panel-${feature.id}`}
        className={`accordion-panel ${isActive ? "accordion-panel-open" : ""}`}
        role="region"
        hidden={!isActive}
      >
        <p className="accordion-description">{feature.description}</p>
      </div>
    </div>
  );
}

function MobileFeatureCard({ feature, index }: { feature: (typeof features)[number]; index: number }) {
  return (
    <div className="mobile-feature-card">
      <div className="mobile-feature-header">
        <FeatureIcon index={index} isActive={true} />
        <h3 className="mobile-feature-title">{feature.title}</h3>
      </div>
      <p className="mobile-feature-description">{feature.description}</p>
      <div className="mobile-feature-media">
        <FeatureVisual featureId={feature.id} />
      </div>
    </div>
  );
}

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>("track");
  const mediaRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => { setIsInView(entry.isIntersecting); }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSelect = useCallback((id: FeatureId) => { setActiveFeature(id); }, []);

  return (
    <section className="feature-showcase" aria-labelledby="showcase-heading">
      <h2 id="showcase-heading" className="showcase-heading">
        Everything you need to build momentum
      </h2>

      <div className="showcase-desktop">
        <div className="showcase-accordion" role="presentation">
          {features.map((feature, index) => (
            <AccordionItem
              key={feature.id}
              feature={feature}
              index={index}
              isActive={activeFeature === feature.id}
              onSelect={() => handleSelect(feature.id)}
            />
          ))}
        </div>
        <div ref={mediaRef} className="showcase-media-panel" aria-live="polite">
          {isInView && <FeatureVisual featureId={activeFeature} />}
        </div>
      </div>

      <div className="showcase-mobile">
        {features.map((feature, index) => (
          <MobileFeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </div>

      <div className="showcase-cta-wrap">
        <a href="/app" className="showcase-cta">Start tracking</a>
      </div>
    </section>
  );
}
