"use client";

import { useState, useRef, useEffect } from "react";
import { TallyDisplay } from "@/components/ui/tally-display";

const platforms = [
  {
    id: "ios",
    label: "iOS",
    features: [
      "Native SwiftUI interface",
      "Offline-first with sync queue",
      "Secure Keychain token storage",
      "Tip jar with StoreKit",
    ],
  },
  {
    id: "android",
    label: "Android",
    features: [
      "Material You + Jetpack Compose",
      "Background sync & notifications",
      "Data export & import",
      "Encrypted credential storage",
    ],
  },
] as const;

const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "All your challenges at a glance — stats, streaks, pace indicators, and a live activity heatmap that makes consistency visible.",
  },
  {
    id: "challenge",
    label: "Challenge Detail",
    description: "Drill into any challenge to see tally marks grow, a weekly burn-up chart, pace status, and your full entry history.",
  },
  {
    id: "community",
    label: "Community",
    description: "Discover public challenges, follow friends, and share your own progress for accountability and motivation.",
  },
] as const;

type PlatformId = (typeof platforms)[number]["id"];
type ScreenId = (typeof screens)[number]["id"];

function DeviceMockup({ children, platform }: { children: React.ReactNode; platform: PlatformId }) {
  return (
    <div className={`device-mockup device-mockup-${platform}`}>
      <div className="device-frame">
        <div className="device-notch" />
        <div className="device-screen">{children}</div>
        <div className="device-home-indicator" />
      </div>
    </div>
  );
}

function ScreenPreview({ screenId, platform }: { screenId: ScreenId; platform: PlatformId }) {
  const isAndroid = platform === "android";
  return (
    <div className={`screen-preview ${isAndroid ? "screen-preview-android" : ""}`} aria-hidden="true">
      <div className="screen-header">
        <div className="screen-status-bar">
          <span className="screen-time">{isAndroid ? "11:23" : "9:41"}</span>
          <div className="screen-status-icons">
            <span className="screen-signal">{isAndroid ? "▲ ▼" : "●●●●○"}</span>
            <span className="screen-battery">{isAndroid ? "82%" : "▐██▌"}</span>
          </div>
        </div>
        <div className="screen-nav-bar">
          <span className="screen-title">
            {screenId === "dashboard" ? "Dashboard" :
             screenId === "challenge" ? "Morning Run" : "Community"}
          </span>
          {screenId === "dashboard" && (
            <span className="screen-sync-badge">✓ Synced</span>
          )}
          {screenId === "challenge" && (
            <span className="screen-back-btn">‹</span>
          )}
        </div>
      </div>

      <div className="screen-content">
        {screenId === "dashboard" && <DashboardPreview isAndroid={isAndroid} />}
        {screenId === "challenge" && <ChallengePreview isAndroid={isAndroid} />}
        {screenId === "community" && <CommunityPreview isAndroid={isAndroid} />}
      </div>

      <div className="screen-bottom-nav">
        <div className={`screen-nav-item ${screenId !== "community" ? "active" : ""}`}>
          <span className="nav-icon">{isAndroid ? "⊞" : "⌂"}</span>
          <span className="nav-label">Home</span>
        </div>
        <div className={`screen-nav-item ${screenId === "community" ? "active" : ""}`}>
          <span className="nav-icon">{isAndroid ? "⊕" : "◎"}</span>
          <span className="nav-label">Community</span>
        </div>
      </div>
    </div>
  );
}

/** Mini heatmap grid — 7 columns × 4 rows of activity intensity dots */
function MiniHeatmap() {
  const cells = [
    0,2,3,1,0,3,2, 1,3,2,0,1,2,3,
    2,1,3,3,2,0,1, 3,2,1,3,2,3,0,
  ];
  return (
    <div className="preview-heatmap" aria-label="Activity heatmap">
      {cells.map((v, i) => (
        <span
          key={i}
          className={`preview-heatmap-cell preview-heatmap-${v}`}
        />
      ))}
    </div>
  );
}

function DashboardPreview({ isAndroid }: { isAndroid: boolean }) {
  return (
    <>
      <div className="preview-stats-row">
        <div className="preview-stat">
          <span className="preview-stat-value">37</span>
          <span className="preview-stat-label">Today</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-value">4,218</span>
          <span className="preview-stat-label">This month</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-value">23d</span>
          <span className="preview-stat-label">Streak</span>
        </div>
        <div className="preview-stat preview-stat-good">
          <span className="preview-stat-value">↑</span>
          <span className="preview-stat-label">Ahead</span>
        </div>
      </div>

      <MiniHeatmap />

      {/* Challenge: Morning Run */}
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-wrapper">
            <TallyDisplay count={5} size="sm" />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Morning Run</span>
            <span className="preview-card-subtitle">156 / 200 km · <span className="preview-pace-ahead">3d ahead</span></span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill" style={{ width: "78%" }} />
        </div>
      </div>

      {/* Challenge: Read 30 Pages */}
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-wrapper">
            <TallyDisplay count={3} size="sm" />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Read 30 Pages</span>
            <span className="preview-card-subtitle">712 / 900 pp · <span className="preview-pace-on">on pace</span></span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill secondary" style={{ width: "79%" }} />
        </div>
      </div>

      {/* Challenge: Cold Plunges */}
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-wrapper">
            <TallyDisplay count={1} size="sm" />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Cold Plunges</span>
            <span className="preview-card-subtitle">45 / 100 · <span className="preview-pace-behind">2d behind</span></span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill behind" style={{ width: "45%" }} />
        </div>
      </div>

      {/* Challenge: Learn Guitar */}
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-wrapper">
            <TallyDisplay count={2} size="sm" />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Learn Guitar</span>
            <span className="preview-card-subtitle">18 / 60 hrs · <span className="preview-pace-on">on pace</span></span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill secondary" style={{ width: "30%" }} />
        </div>
      </div>
    </>
  );
}

function ChallengePreview({ isAndroid }: { isAndroid: boolean }) {
  return (
    <>
      {/* Pace badge */}
      <div className="preview-pace-badge preview-pace-badge-ahead">
        <span className="preview-pace-badge-icon">↑</span>
        <span>3 days ahead of pace</span>
      </div>

      {/* Big tally count */}
      <div className="preview-tally-large">
        <div className="preview-tally-wrapper-lg">
          <TallyDisplay count={156} size="md" />
        </div>
        <span className="preview-tally-count">156 / 200 km</span>
        <span className="preview-tally-subcount">78% complete · 44 km remaining</span>
      </div>

      {/* Weekly bar chart */}
      <div className="preview-chart">
        <div className="preview-chart-header">
          <span className="preview-chart-title">This week</span>
          <span className="preview-chart-total">38 km</span>
        </div>
        <div className="preview-chart-bars">
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "60%" }} />
            <span className="preview-bar-label">M</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "85%" }} />
            <span className="preview-bar-label">T</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "40%" }} />
            <span className="preview-bar-label">W</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "95%" }} />
            <span className="preview-bar-label">T</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "70%" }} />
            <span className="preview-bar-label">F</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar" style={{ height: "100%" }} />
            <span className="preview-bar-label">S</span>
          </div>
          <div className="preview-bar-wrap">
            <div className="preview-bar active" style={{ height: "50%" }} />
            <span className="preview-bar-label">S</span>
          </div>
        </div>
      </div>

      {/* Recent entries */}
      <div className="preview-entries-header">Recent entries</div>
      <div className="preview-entry">
        <span className="preview-entry-date">Today</span>
        <div className="preview-entry-mid">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={5} size="sm" />
          </div>
          <span className="preview-entry-value">5 km</span>
        </div>
        <span className="preview-entry-note">Easy pace</span>
      </div>
      <div className="preview-entry">
        <span className="preview-entry-date">Yesterday</span>
        <div className="preview-entry-mid">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={8} size="sm" />
          </div>
          <span className="preview-entry-value">8 km</span>
        </div>
        <span className="preview-entry-note">Tempo run</span>
      </div>
      <div className="preview-entry">
        <span className="preview-entry-date">Mon</span>
        <div className="preview-entry-mid">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={6} size="sm" />
          </div>
          <span className="preview-entry-value">6 km</span>
        </div>
        <span className="preview-entry-note">Recovery</span>
      </div>
    </>
  );
}

function CommunityPreview({ isAndroid }: { isAndroid: boolean }) {
  return (
    <>
      <div className="preview-search">
        <span className="preview-search-icon">⌕</span>
        <span className="preview-search-text">Search challenges…</span>
      </div>

      <div className="preview-tabs">
        <span className="preview-tab active">Discover</span>
        <span className="preview-tab">Following <span className="badge">4</span></span>
      </div>

      <div className="preview-public-card">
        <div className="preview-public-header">
          <span className="preview-avatar preview-avatar-pink">E</span>
          <div className="preview-public-info">
            <span className="preview-public-name">Draw Every Day</span>
            <span className="preview-public-owner">by @studio.lina</span>
          </div>
          <button className="preview-follow-btn following">Following</button>
        </div>
        <div className="preview-public-footer">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={5} size="sm" />
          </div>
          <span className="preview-public-stats-text">289 / 365 drawings</span>
        </div>
      </div>

      <div className="preview-public-card">
        <div className="preview-public-header">
          <span className="preview-avatar preview-avatar-blue">M</span>
          <div className="preview-public-info">
            <span className="preview-public-name">100 Cold Plunges</span>
            <span className="preview-public-owner">by @marcus_t</span>
          </div>
          <button className="preview-follow-btn">Follow</button>
        </div>
        <div className="preview-public-footer">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={10} size="sm" />
          </div>
          <span className="preview-public-stats-text">67 / 100 plunges</span>
        </div>
      </div>

      <div className="preview-public-card">
        <div className="preview-public-header">
          <span className="preview-avatar preview-avatar-green">S</span>
          <div className="preview-public-info">
            <span className="preview-public-name">Learn Mandarin</span>
            <span className="preview-public-owner">by @polyglot_sam</span>
          </div>
          <button className="preview-follow-btn">Follow</button>
        </div>
        <div className="preview-public-footer">
          <div className="preview-tally-wrapper-xs">
            <TallyDisplay count={5} size="sm" />
          </div>
          <span className="preview-public-stats-text">142 / 365 sessions</span>
        </div>
      </div>
    </>
  );
}

function PlatformFeatures({ platform }: { platform: (typeof platforms)[number] }) {
  return (
    <div className="platform-features">
      <h4 className="platform-name">{platform.label}</h4>
      <ul className="platform-feature-list">
        {platform.features.map((feature, i) => (
          <li key={i} className="platform-feature-item">
            <span className="feature-check">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AppShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("dashboard");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("ios");

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold: 0.1, rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeScreenData = screens.find((s) => s.id === activeScreen)!;

  return (
    <section ref={sectionRef} className="app-showcase" aria-labelledby="app-showcase-heading">
      <h2 id="app-showcase-heading" className="app-showcase-heading">
        Native on every platform
      </h2>
      <p className="app-showcase-subhead">
        SwiftUI on iOS. Jetpack Compose on Android. Offline-first, always in sync.
      </p>

      <div className="platform-toggle" role="tablist">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            role="tab"
            aria-selected={activePlatform === platform.id}
            className={`platform-tab ${activePlatform === platform.id ? "active" : ""}`}
            onClick={() => setActivePlatform(platform.id)}
          >
            {platform.id === "ios" ? "🍎" : "🤖"} {platform.label}
          </button>
        ))}
      </div>

      <div className="app-showcase-devices">
        <div className="screen-tabs" role="tablist">
          {screens.map((screen) => (
            <button
              key={screen.id}
              role="tab"
              aria-selected={activeScreen === screen.id}
              className={`screen-tab ${activeScreen === screen.id ? "active" : ""}`}
              onClick={() => setActiveScreen(screen.id)}
            >
              {screen.label}
            </button>
          ))}
        </div>

        <div className="device-showcase-area">
          {isInView && (
            <DeviceMockup platform={activePlatform}>
              <ScreenPreview screenId={activeScreen} platform={activePlatform} />
            </DeviceMockup>
          )}
        </div>

        <div className="screen-description">
          <h3 className="screen-description-title">{activeScreenData.label}</h3>
          <p className="screen-description-text">{activeScreenData.description}</p>
        </div>
      </div>

      <div className="platforms-grid">
        {platforms.map((platform) => (
          <PlatformFeatures key={platform.id} platform={platform} />
        ))}
      </div>

      <div className="app-showcase-cta-wrap">
        <a href="/app" className="app-showcase-cta">Start tracking now</a>
      </div>

      <div className="app-showcase-stores">
        <span className="app-showcase-stores-label">Coming soon:</span>
        <a href="/ios" className="store-link"><span className="store-icon">🍎</span> App Store</a>
        <a href="/android" className="store-link"><span className="store-icon">▶️</span> Google Play</a>
      </div>
    </section>
  );
}
