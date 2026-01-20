import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <section className="card">
        <span className="eyebrow">Tally</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Make progress visible.
        </h1>
        <p className="mt-4 text-lg text-muted">
          A calm, tactile tracker that turns daily effort into clear momentum.
        </p>
        <div className="actions">
          <Link className="cta" href="/app">
            Open app
          </Link>
          <Link className="link" href="/app">
            Preview app shell
          </Link>
        </div>
        <div className="tally" aria-hidden="true">
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="stroke" />
          <span className="slash" />
        </div>
      </section>
    </main>
  );
}
