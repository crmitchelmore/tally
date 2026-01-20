"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Feature data for the showcase section
 */
const features = [
  {
    id: "track",
    title: "Track anything",
    description:
      "Set a target and log progress with satisfying tally marks. Daily, monthly, or yearly goals — your pace, your rules.",
    media: null, // Placeholder for future screenshots/videos
    mediaBg: "var(--color-paper)",
  },
  {
    id: "progress",
    title: "See real progress",
    description:
      "Visualize your journey with heatmaps and streaks. Know if you're ahead, on pace, or behind — without judgment.",
    media: null,
    mediaBg: "var(--color-paper)",
  },
  {
    id: "sync",
    title: "Sync everywhere",
    description:
      "Works offline, syncs when connected. Your data follows you across web, iOS, and Android.",
    media: null,
    mediaBg: "var(--color-paper)",
  },
  {
    id: "community",
    title: "Share with others",
    description:
      "Make challenges public for accountability. Follow friends and cheer on their progress.",
    media: null,
    mediaBg: "var(--color-paper)",
  },
] as const;

type FeatureId = (typeof features)[number]["id"];

/**
 * Tally-style feature icon (4 strokes + optional slash for index >= 4)
 */
function FeatureIcon({ index, isActive }: { index: number; isActive: boolean }) {
  const strokeCount = Math.min(index + 1, 4);
  const hasSlash = index >= 4;

  return (
    <div
      className="feature-icon"
      aria-hidden="true"
      style={{
        opacity: isActive ? 1 : 0.4,
        transition: "opacity 150ms ease",
      }}
    >
      {Array.from({ length: strokeCount }).map((_, i) => (
        <span key={i} className="feature-icon-stroke" />
      ))}
      {hasSlash && <span className="feature-icon-slash" />}
    </div>
  );
}

/**
 * Placeholder media panel — shows a tally-styled placeholder
 * Replace with actual screenshots/videos when available
 */
function MediaPlaceholder({ featureId }: { featureId: FeatureId }) {
  return (
    <div className="feature-media-placeholder" aria-hidden="true">
      <div className="feature-media-tally">
        <span className="fmp-stroke" />
        <span className="fmp-stroke" />
        <span className="fmp-stroke" />
        <span className="fmp-stroke" />
        <span className="fmp-slash" />
      </div>
      <span className="feature-media-label">{featureId}</span>
    </div>
  );
}

/**
 * Desktop accordion item
 */
function AccordionItem({
  feature,
  index,
  isActive,
  onSelect,
}: {
  feature: (typeof features)[number];
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`accordion-item ${isActive ? "accordion-item-active" : ""}`}>
      <button
        ref={buttonRef}
        className="accordion-trigger"
        onClick={onSelect}
        aria-expanded={isActive}
        aria-controls={`panel-${feature.id}`}
      >
        <FeatureIcon index={index} isActive={isActive} />
        <span className="accordion-title">{feature.title}</span>
        <span className="accordion-arrow" aria-hidden="true">
          {isActive ? "−" : "+"}
        </span>
      </button>
      <div
        id={`panel-${feature.id}`}
        className={`accordion-panel ${isActive ? "accordion-panel-open" : ""}`}
        role="region"
        aria-labelledby={`trigger-${feature.id}`}
        hidden={!isActive}
      >
        <p className="accordion-description">{feature.description}</p>
      </div>
    </div>
  );
}

/**
 * Mobile feature card (stacked layout)
 */
function MobileFeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  return (
    <div className="mobile-feature-card">
      <div className="mobile-feature-header">
        <FeatureIcon index={index} isActive={true} />
        <h3 className="mobile-feature-title">{feature.title}</h3>
      </div>
      <p className="mobile-feature-description">{feature.description}</p>
      <div className="mobile-feature-media">
        <MediaPlaceholder featureId={feature.id} />
      </div>
    </div>
  );
}

/**
 * FeatureShowcase — desktop accordion + media panel, mobile stacked cards
 */
export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>("track");
  const mediaRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Lazy visibility detection for media
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleSelect = useCallback((id: FeatureId) => {
    setActiveFeature(id);
  }, []);

  const activeFeatureData = features.find((f) => f.id === activeFeature)!;

  return (
    <section className="feature-showcase" aria-labelledby="showcase-heading">
      <h2 id="showcase-heading" className="showcase-heading">
        Everything you need to build momentum
      </h2>

      {/* Desktop layout: accordion + media panel */}
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

        <div
          ref={mediaRef}
          className="showcase-media-panel"
          style={{ background: activeFeatureData.mediaBg }}
          aria-live="polite"
        >
          {isInView && <MediaPlaceholder featureId={activeFeature} />}
        </div>
      </div>

      {/* Mobile layout: stacked cards */}
      <div className="showcase-mobile">
        {features.map((feature, index) => (
          <MobileFeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </div>

      {/* Single CTA */}
      <div className="showcase-cta-wrap">
        <a href="/app" className="showcase-cta">
          Start tracking
        </a>
      </div>
    </section>
  );
}
