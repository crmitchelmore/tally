import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tally for Android — Closed Beta",
  description:
    "Track your progress with tactile tally marks on Android. Tally is in closed testing on Google Play. Invited testers can join the beta; everyone can start on the web.",
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
        <h1 className="platform-heading">A little more you, every day.</h1>
        <p className="platform-subhead">
          Familiar tally marks, a gentle nudge, and room to find your pace.
          Made for Android, currently in closed testing.
        </p>

        <div className="platform-release-note">
          <img src="/icon.svg" alt="" width="64" height="64" className="platform-app-icon" />
          <strong>A small group. A few first marks.</strong>
          <p>The Google Play beta is open to invited testers. Use the Google account from your invitation to join.</p>
          <a className="link" href="https://play.google.com/apps/testing/app.tally.android">Invited? Join the Android beta</a>
        </div>

        {/* CTA to web app */}
        <div className="platform-actions">
          <Link className="cta" href="/offline">
            Make your first mark
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
            <span>Familiar Android controls, with a little ink and warmth</span>
          </li>
          <li className="platform-feature-item">
            <span className="platform-feature-icon" aria-hidden="true">
              ✦
            </span>
            <span>Your progress across devices when connected</span>
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
