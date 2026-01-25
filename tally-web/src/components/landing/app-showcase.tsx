"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

/**
 * App showcase screens - shows iOS and Android app previews
 * with device mockups and feature highlights
 */
const platforms = [
  {
    id: "ios",
    label: "iOS",
    features: [
      "Native SwiftUI interface",
      "Dashboard with stats & heatmap",
      "Sets & reps tracking",
      "Offline-first sync",
    ],
  },
  {
    id: "android",
    label: "Android",
    features: [
      "Material You design",
      "Progress charts & burn-up",
      "Community challenges",
      "Data export & import",
    ],
  },
] as const;

const screens = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "See all your challenges at a glance with clear progress indicators, personal records, and activity heatmap.",
  },
  {
    id: "challenge",
    label: "Challenge Detail",
    description: "Track daily entries with satisfying tally marks, burn-up charts, and real-time pace indicators.",
  },
  {
    id: "community",
    label: "Community",
    description: "Discover public challenges, follow friends, and share your progress for accountability.",
  },
] as const;

type PlatformId = (typeof platforms)[number]["id"];
type ScreenId = (typeof screens)[number]["id"];

/**
 * Device mockup frame - shows a phone-shaped container
 */
function DeviceMockup({ 
  children, 
  platform 
}: { 
  children: React.ReactNode;
  platform: PlatformId;
}) {
  return (
    <div className={`device-mockup device-mockup-${platform}`}>
      <div className="device-frame">
        <div className="device-notch" />
        <div className="device-screen">
          {children}
        </div>
        <div className="device-home-indicator" />
      </div>
    </div>
  );
}

/**
 * Tally-styled screen preview showing a mockup of the app UI
 */
function ScreenPreview({ 
  screenId, 
  platform 
}: { 
  screenId: ScreenId;
  platform: PlatformId;
}) {
  return (
    <div className="screen-preview" aria-hidden="true">
      {/* App header */}
      <div className="screen-header">
        <div className="screen-status-bar">
          <span className="screen-time">9:41</span>
          <div className="screen-status-icons">
            <span className="screen-signal">●●●●○</span>
            <span className="screen-battery">▐██▌</span>
          </div>
        </div>
        <div className="screen-nav-bar">
          <span className="screen-title">
            {screenId === "dashboard" ? "Dashboard" : 
             screenId === "challenge" ? "Push-ups 2024" : "Community"}
          </span>
          {screenId === "dashboard" && (
            <span className="screen-sync-badge">✓ Synced</span>
          )}
        </div>
      </div>
      
      {/* Screen content based on type */}
      <div className="screen-content">
        {screenId === "dashboard" && <DashboardPreview />}
        {screenId === "challenge" && <ChallengePreview />}
        {screenId === "community" && <CommunityPreview />}
      </div>
      
      {/* Bottom navigation */}
      <div className="screen-bottom-nav">
        <div className={`screen-nav-item ${screenId === "dashboard" || screenId === "challenge" ? "active" : ""}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </div>
        <div className={`screen-nav-item ${screenId === "community" ? "active" : ""}`}>
          <span className="nav-icon">👥</span>
          <span className="nav-label">Community</span>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <>
      {/* Stats row */}
      <div className="preview-stats-row">
        <div className="preview-stat">
          <span className="preview-stat-value">247</span>
          <span className="preview-stat-label">Today</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-value">8,421</span>
          <span className="preview-stat-label">Total</span>
        </div>
        <div className="preview-stat">
          <span className="preview-stat-value">14d</span>
          <span className="preview-stat-label">Streak</span>
        </div>
        <div className="preview-stat preview-stat-good">
          <span className="preview-stat-value">↑</span>
          <span className="preview-stat-label">Ahead</span>
        </div>
      </div>
      
      {/* Challenge cards */}
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-mini">
            <span /><span /><span /><span />
            <span className="slash" />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Push-ups 2024</span>
            <span className="preview-card-subtitle">10,000 target · 84% done</span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill" style={{ width: "84%" }} />
        </div>
      </div>
      
      <div className="preview-challenge-card">
        <div className="preview-card-header">
          <div className="preview-tally-mini small">
            <span /><span /><span />
          </div>
          <div className="preview-card-info">
            <span className="preview-card-title">Read 50 Books</span>
            <span className="preview-card-subtitle">50 target · 62% done</span>
          </div>
          <span className="preview-add-btn">+</span>
        </div>
        <div className="preview-progress-bar">
          <div className="preview-progress-fill secondary" style={{ width: "62%" }} />
        </div>
      </div>
    </>
  );
}

function ChallengePreview() {
  return (
    <>
      {/* Big tally visualization */}
      <div className="preview-tally-large">
        <div className="preview-tally-row">
          {/* 25-unit X mark */}
          <div className="preview-25-unit">
            <div className="preview-tally-group">
              <span /><span /><span /><span /><span className="slash" />
            </div>
            <div className="preview-x-overlay">✕</div>
          </div>
          <div className="preview-25-unit">
            <div className="preview-tally-group">
              <span /><span /><span /><span /><span className="slash" />
            </div>
            <div className="preview-x-overlay">✕</div>
          </div>
        </div>
        <span className="preview-tally-count">8,421 / 10,000</span>
      </div>
      
      {/* Mini chart */}
      <div className="preview-chart">
        <div className="preview-chart-bars">
          <div className="preview-bar" style={{ height: "40%" }} />
          <div className="preview-bar" style={{ height: "65%" }} />
          <div className="preview-bar" style={{ height: "50%" }} />
          <div className="preview-bar" style={{ height: "80%" }} />
          <div className="preview-bar" style={{ height: "70%" }} />
          <div className="preview-bar" style={{ height: "90%" }} />
          <div className="preview-bar active" style={{ height: "75%" }} />
        </div>
        <span className="preview-chart-label">Last 7 days</span>
      </div>
      
      {/* Entry list */}
      <div className="preview-entry">
        <span className="preview-entry-date">Today</span>
        <span className="preview-entry-count">+247</span>
        <span className="preview-entry-feeling">🔥</span>
      </div>
      <div className="preview-entry">
        <span className="preview-entry-date">Yesterday</span>
        <span className="preview-entry-count">+180</span>
        <span className="preview-entry-feeling">😊</span>
      </div>
    </>
  );
}

function CommunityPreview() {
  return (
    <>
      {/* Search bar */}
      <div className="preview-search">
        <span className="preview-search-icon">🔍</span>
        <span className="preview-search-text">Search challenges...</span>
      </div>
      
      {/* Tab bar */}
      <div className="preview-tabs">
        <span className="preview-tab active">Discover</span>
        <span className="preview-tab">Following <span className="badge">3</span></span>
      </div>
      
      {/* Public challenge cards */}
      <div className="preview-public-card">
        <div className="preview-public-header">
          <span className="preview-avatar">👤</span>
          <div className="preview-public-info">
            <span className="preview-public-name">Marathon Training</span>
            <span className="preview-public-owner">by Sarah K.</span>
          </div>
          <button className="preview-follow-btn">Follow</button>
        </div>
        <div className="preview-public-stats">
          <span>1,250 / 2,000 miles</span>
          <span>24 followers</span>
        </div>
      </div>
      
      <div className="preview-public-card">
        <div className="preview-public-header">
          <span className="preview-avatar">👤</span>
          <div className="preview-public-info">
            <span className="preview-public-name">100 Days of Code</span>
            <span className="preview-public-owner">by DevCommunity</span>
          </div>
          <button className="preview-follow-btn following">Following</button>
        </div>
        <div className="preview-public-stats">
          <span>Day 67 / 100</span>
          <span>156 followers</span>
        </div>
      </div>
    </>
  );
}

/**
 * Platform feature list
 */
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

/**
 * AppShowcase — Preview the app UI on both iOS and Android
 * 
 * Per design philosophy:
 * - Tactile: device mockups with realistic frames
 * - Focused: one screen at a time with clear description
 * - Honest: realistic UI previews showing actual features
 */
export function AppShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("dashboard");
  const [activePlatform, setActivePlatform] = useState<PlatformId>("ios");

  // Lazy visibility detection
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const activeScreenData = screens.find((s) => s.id === activeScreen)!;

  return (
    <section
      ref={sectionRef}
      className="app-showcase"
      aria-labelledby="app-showcase-heading"
    >
      <h2 id="app-showcase-heading" className="app-showcase-heading">
        Native apps for iOS & Android
      </h2>
      <p className="app-showcase-subhead">
        Beautiful, fast, and offline-first. Your progress syncs everywhere.
      </p>

      {/* Platform toggle */}
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

      {/* Device showcase area */}
      <div className="app-showcase-devices">
        {/* Screen selector tabs */}
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

        {/* Device mockup */}
        <div className="device-showcase-area">
          {isInView && (
            <DeviceMockup platform={activePlatform}>
              <ScreenPreview screenId={activeScreen} platform={activePlatform} />
            </DeviceMockup>
          )}
        </div>

        {/* Screen description */}
        <div className="screen-description">
          <h3 className="screen-description-title">{activeScreenData.label}</h3>
          <p className="screen-description-text">{activeScreenData.description}</p>
        </div>
      </div>

      {/* Platform features grid */}
      <div className="platforms-grid">
        {platforms.map((platform) => (
          <PlatformFeatures key={platform.id} platform={platform} />
        ))}
      </div>

      {/* Primary CTA */}
      <div className="app-showcase-cta-wrap">
        <a href="/app" className="app-showcase-cta">
          Start tracking now
        </a>
      </div>

      {/* App store links */}
      <div className="app-showcase-stores">
        <span className="app-showcase-stores-label">Download the apps:</span>
        <a href="/ios" className="store-link">
          <span className="store-icon">🍎</span>
          App Store
        </a>
        <a href="/android" className="store-link">
          <span className="store-icon">▶️</span>
          Google Play
        </a>
      </div>
    </section>
  );
}
