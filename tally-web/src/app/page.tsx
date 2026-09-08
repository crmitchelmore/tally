import Link from "next/link";
import { HeroMicroDemo, FeatureShowcase, HowItWorks, LiveSyncDemo, AppShowcase } from "@/components/landing";
import { TallyMark } from "@/components/ui/tally-mark";

export default function Home() {
  return (
    <div className="tally-home">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <Link href="/" className="tally-wordmark" aria-label="Tally home">
          <TallyMark count={5} size="sm" /><span>tally</span>
        </Link>
        <nav aria-label="Website navigation">
          <a href="#how-it-works" className="landing-nav-link">How it works</a>
          <Link href="/ios" className="landing-nav-link">Get the app</Link>
          <Link href="/app" className="link">Open app</Link>
        </nav>
      </header>
      <main className="landing refresh-landing" id="main-content">
        <section className="refresh-hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow">A little effort. A lasting mark.</p>
            <h1 id="hero-heading">Make progress<br /><span>visible.</span></h1>
            <p className="hero-description">For the things you want to do more of.<br />Set a goal, make your mark, find your own pace.</p>
            <div className="actions">
              <Link className="cta" href="/offline">Try without account</Link>
              <Link className="hero-secondary" href="/app">Sign in to Tally</Link>
            </div>
            <p className="hero-footnote">Start here in your browser. No account needed.</p>
          </div>
          <div className="hero-workspace">
            <div className="workspace-caption"><span>A SMALL START</span><span>TRY IT YOURSELF</span></div>
            <HeroMicroDemo />
            <p className="workspace-note">One tap. One mark. A little further along.</p>
          </div>
        </section>
        <div className="landing-principles" aria-label="The Tally approach">
          <p><span>01</span> Your goals, your pace</p>
          <p><span>02</span> Every little bit counts</p>
          <p><span>03</span> Progress over perfection</p>
        </div>
        <FeatureShowcase />
        <div id="how-it-works" className="landing-section-anchor"><HowItWorks /></div>
        <AppShowcase />
        <LiveSyncDemo />
        <section className="landing-closing" aria-labelledby="closing-heading">
          <TallyMark count={5} size="lg" />
          <p className="eyebrow">Make room for what matters</p>
          <h2 id="closing-heading">A mark today.<br />Momentum tomorrow.</h2>
          <p>Read a page. Run a kilometre. Practise for a minute.<br />Whatever your goal, it starts with one.</p>
          <Link href="/offline" className="cta">Start your first tally</Link>
        </section>
      </main>
      <footer className="landing-footer">
        <Link href="/" className="tally-wordmark"><TallyMark count={5} size="sm" /><span>tally</span></Link>
        <span>Small efforts. Real progress.</span>
        <div><Link href="/ios">iOS app</Link><Link href="/android">Android · coming soon</Link></div>
      </footer>
    </div>
  );
}
