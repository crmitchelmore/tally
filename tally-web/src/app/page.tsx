import Link from "next/link";
import { HeroMicroDemo, FeatureShowcase, HowItWorks, TestimonialsStats, LiveSyncDemo, AppShowcase } from "@/components/landing";

export default function Home() {
  return (
    <main className="landing">
      <section className="card hero-card">
        <span className="eyebrow">Tally</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Make progress visible.
        </h1>
        <p className="mt-4 text-lg text-muted">
          A calm, tactile tracker that turns daily effort into clear momentum.
        </p>
        
        {/* Interactive micro-demo */}
        <div className="mt-8">
          <HeroMicroDemo />
        </div>

        <div className="actions mt-6">
          <Link className="cta" href="/app">
            Open app
          </Link>
          <Link className="link" href="/offline">
            Try without account
          </Link>
        </div>

        {/* Static tally mark for decoration (hidden when demo is active) */}
        <div className="tally decorative-tally" aria-hidden="true">
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="slash" />
        </div>
      </section>

      {/* Feature showcase section */}
      <FeatureShowcase />

      {/* How it works section */}
      <HowItWorks />

      {/* App showcase section */}
      <AppShowcase />

      {/* Live sync demo section */}
      <LiveSyncDemo />

      {/* Testimonials + stats section */}
      <TestimonialsStats />
    </main>
  );
}
