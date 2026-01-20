export default function Home() {
  return (
    <main>
      <section className="card">
        <span className="eyebrow">Tally</span>
        <h1>Make progress visible.</h1>
        <p>
          A calm, tactile tracker that turns daily effort into clear momentum.
        </p>
        <div className="actions">
          <a className="cta" href="/app">
            Open app
          </a>
          <a className="link" href="/app">
            Preview app shell
          </a>
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
