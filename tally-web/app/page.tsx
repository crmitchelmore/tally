import Link from "next/link";
import { HeroDemo } from "./ui/hero-demo";
import { FeatureShowcase } from "./ui/feature-showcase";
import { HowItWorks } from "./ui/how-it-works";
import { LiveSyncDemo } from "./ui/live-sync-demo";
import { TestimonialsStats } from "./ui/testimonials-stats";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px 96px",
        gap: "96px",
        background:
          "linear-gradient(180deg, rgba(247,247,245,1) 0%, rgba(243,242,238,1) 100%)",
      }}
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "48px",
          alignItems: "center",
          width: "min(1100px, 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#6b6b6b",
              margin: 0,
            }}
          >
            Tally
          </p>
          <h1
            style={{
              fontSize: "44px",
              lineHeight: "1.1",
              margin: 0,
              maxWidth: "520px",
            }}
          >
            Track progress with honest, ink-like marks.
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "520px",
              color: "#4b4b4b",
              fontSize: "16px",
            }}
          >
            A calm space to log what matters, stay on pace, and see momentum grow
            without pressure.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: "44px",
                padding: "0 24px",
                borderRadius: "999px",
                backgroundColor: "#b21f24",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Open the app
            </Link>
            <Link
              href="/sign-in"
              style={{
                color: "#b21f24",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              style={{
                color: "#b21f24",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Create account
            </Link>
          </div>
        </div>
        <HeroDemo />
      </section>
      <FeatureShowcase />
      <HowItWorks />
      <LiveSyncDemo />
      <TestimonialsStats />
    </main>
  );
}
