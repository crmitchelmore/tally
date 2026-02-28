import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tally for iOS — Available on the App Store",
  description:
    "Track your progress with tactile tally marks on iPhone and iPad. Download Tally free on the App Store.",
};

export default function IOSPage() {
  return (
    <main className="platform-page">
      <section className="platform-hero">
        {/* Tally decoration */}
        <div className="tally platform-tally" aria-hidden="true">
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="slash" />
        </div>

        <span className="platform-eyebrow">Tally for iOS</span>
        <h1 className="platform-heading">Available on iPhone &amp; iPad</h1>
        <p className="platform-subhead">
          Calm, tactile tracking — native on iOS with widgets,
          haptic feedback, and offline-first sync.
        </p>

        {/* App Store button */}
        <a
          href="https://apps.apple.com/app/tally-make-progress-visible/id6740626498"
          className="platform-store-btn"
          aria-label="Download on the App Store"
        >
          <svg
            className="platform-store-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="platform-store-text">
            <span className="platform-store-label">Download on the</span>
            <span className="platform-store-name">App Store</span>
          </div>
        </a>

        {/* CTA to web app */}
        <div className="platform-actions">
          <Link className="cta" href="/app">
            Open the web app
          </Link>
          <Link className="link" href="/">
            Back to home
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="platform-features" aria-labelledby="ios-features-heading">
        <h2 id="ios-features-heading" className="sr-only">
          Features
        </h2>
        <ul className="platform-feature-list">
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Native SwiftUI with tactile tally mark animations</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Lock Screen &amp; Home Screen widgets</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Haptic milestone celebrations</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Activity heatmaps, streaks &amp; personal records</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Offline-first — track anywhere, sync when connected</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Community challenges — discover &amp; follow others</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
