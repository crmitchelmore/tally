import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tally for iOS — Coming to iPhone and iPad",
  description:
    "Track your progress with tactile tally marks on iPhone and iPad. The iOS app is in App Store review. Start your first tally in your browser today.",
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
        <h1 className="platform-heading">A little progress, in your pocket.</h1>
        <p className="platform-subhead">
          The same paper, ink and little moments of encouragement,
          made for iPhone and iPad.
        </p>

        <div className="platform-release-note">
          <img src="/icon.svg" alt="" width="64" height="64" className="platform-app-icon" />
          <strong>One last stop before the App Store.</strong>
          <p>Tally is waiting for Apple’s review. Already a tester? Your latest build is in TestFlight. Everyone can start on the web today.</p>
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
            <span>Tally marks that draw like ink on paper</span>
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
            <span>Private goals — your progress, at your pace</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
