import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tally for Android — Coming Soon",
  description:
    "Track your progress with tactile tally marks on Android. Sign up to be notified when Tally launches on Google Play.",
};

export default function AndroidPage() {
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

        <span className="platform-eyebrow">Tally for Android</span>
        <h1 className="platform-heading">Coming soon to Android</h1>
        <p className="platform-subhead">
          The same calm, tactile tracking experience — native on Android.
          Sign up to be the first to know when we launch.
        </p>

        {/* Google Play placeholder button */}
        <div className="platform-store-btn" aria-label="Get it on Google Play (coming soon)">
          <svg
            className="platform-store-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3 20.5v-17c0-.83.52-1.51 1.25-1.79l8.75 9.29-8.75 9.29C3.52 22.01 3 21.33 3 20.5zm10.29-9.29l2.32-2.46 5.74 3.31c.83.48.83 1.64 0 2.12l-5.74 3.31-2.32-2.46 2.71-1.91-2.71-1.91zm-1.41 1.5L4.2 21.08l7.68-8.37zm0-1.42l7.68-8.37-7.68 8.37z" />
          </svg>
          <div className="platform-store-text">
            <span className="platform-store-label">Coming soon on</span>
            <span className="platform-store-name">Google Play</span>
          </div>
        </div>

        {/* CTA to web app */}
        <div className="platform-actions">
          <Link className="cta" href="/app">
            Try the web app now
          </Link>
          <Link className="link" href="/">
            Back to home
          </Link>
        </div>
      </section>

      {/* Features preview */}
      <section className="platform-features" aria-labelledby="android-features-heading">
        <h2 id="android-features-heading" className="sr-only">
          What to expect
        </h2>
        <ul className="platform-feature-list">
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Material Design with tactile tally animations</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Real-time sync across all your devices</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Offline-first — track anywhere, sync when connected</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
