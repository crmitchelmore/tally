"use client";

import { useState, useRef, useEffect } from "react";

/**
 * App showcase screens with tally-styled placeholders
 * Replace media: null with actual screenshots/videos when available
 */
const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "See all your challenges at a glance with clear progress indicators.",
  },
  {
    id: "challenge",
    label: "Challenge Detail",
    description: "Track daily entries with satisfying tally marks and real-time stats.",
  },
] as const;

type ScreenId = (typeof screens)[number]["id"];

/**
 * Static tally placeholder for media frames
 * Shown as subtle background when no media is loaded
 */
function TallyPlaceholder({ screenId }: { screenId: ScreenId }) {
  return (
    <div className="app-showcase-placeholder" aria-hidden="true">
      <div className="app-showcase-tally">
        <span className="asp-stroke" />
        <span className="asp-stroke" />
        <span className="asp-stroke" />
        <span className="asp-stroke" />
        <span className="asp-slash" />
      </div>
      <span className="app-showcase-screen-label">{screenId}</span>
    </div>
  );
}

/**
 * Screen preview card with lazy loading support
 */
function ScreenPreview({
  screen,
  isInView,
}: {
  screen: (typeof screens)[number];
  isInView: boolean;
}) {
  return (
    <div className="app-showcase-frame" role="img" aria-label={`${screen.label} preview`}>
      {/* Only render content when in viewport */}
      {isInView && <TallyPlaceholder screenId={screen.id} />}
      <div className="app-showcase-caption">
        <h3 className="app-showcase-caption-title">{screen.label}</h3>
        <p className="app-showcase-caption-text">{screen.description}</p>
      </div>
    </div>
  );
}

/**
 * AppShowcase — Preview the app UI with a focused, honest feel
 * 
 * Per design philosophy:
 * - Tactile: ink-like transitions on media
 * - Focused: one CTA, minimal copy
 * - Honest: real UI or faithful placeholders
 */
export function AppShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Lazy visibility detection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Once in view, keep content rendered (no unload on scroll)
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="app-showcase"
      aria-labelledby="app-showcase-heading"
    >
      <h2 id="app-showcase-heading" className="app-showcase-heading">
        A calm place to track what matters
      </h2>
      <p className="app-showcase-subhead">
        Progress, not perfection. See your momentum build over time.
      </p>

      {/* Screen previews grid */}
      <div className="app-showcase-grid">
        {screens.map((screen) => (
          <ScreenPreview key={screen.id} screen={screen} isInView={isInView} />
        ))}
      </div>

      {/* Primary CTA */}
      <div className="app-showcase-cta-wrap">
        <a href="/app" className="app-showcase-cta">
          Start tracking
        </a>
      </div>

      {/* Platform links */}
      <div className="app-showcase-platforms">
        <span className="app-showcase-platforms-label">Coming soon:</span>
        <a href="/ios" className="app-showcase-platform-link">
          iOS
        </a>
        <span className="app-showcase-platform-sep" aria-hidden="true">
          ·
        </span>
        <a href="/android" className="app-showcase-platform-link">
          Android
        </a>
      </div>
    </section>
  );
}
