import Link from "next/link";

const QUOTES = [
  {
    quote:
      "Logging takes a breath, and the pace view keeps me steady without guilt.",
    name: "Maya",
    detail: "Morning pages",
  },
  {
    quote:
      "Offline days still count. I can see what needs syncing and move on.",
    name: "Julian",
    detail: "Marathon training",
  },
  {
    quote:
      "Watching the tallies stack up keeps my focus on the work, not the streak.",
    name: "Priya",
    detail: "Language practice",
  },
];

const STATS = [
  {
    value: "3 steps",
    label: "Intent, tally, pace. Clear flow from start to progress.",
  },
  {
    value: "5-mark groups",
    label: "Ink tallies bundle progress into calm, readable beats.",
  },
  {
    value: "7-day rhythm",
    label: "Weekly pace stays visible without noisy charts.",
  },
];

export function TestimonialsStats() {
  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-heading">
        <p className="testimonials-eyebrow">Trust the pace</p>
        <h2 id="testimonials-title">Proof that calm progress adds up.</h2>
        <p className="testimonials-subhead">
          A few quiet voices and the signals that keep Tally honest.
        </p>
      </div>
      <div className="testimonials-grid">
        <div className="testimonials-quotes">
          {QUOTES.map((item) => (
            <figure key={item.name} className="quote-card">
              <blockquote>“{item.quote}”</blockquote>
              <figcaption>
                <span className="quote-name">{item.name}</span>
                <span className="quote-detail">{item.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="testimonials-stats">
          <div className="stats-card">
            {STATS.map((stat) => (
              <div key={stat.value} className="stat-row">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <Link href="/app" className="testimonials-cta">
            Open the app
          </Link>
        </div>
      </div>
      <style>{`
        .testimonials {
          width: min(1100px, 100%);
          display: grid;
          gap: 28px;
        }
        .testimonials-heading h2 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }
        .testimonials-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .testimonials-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
        .testimonials-grid {
          display: grid;
          gap: 20px;
        }
        .testimonials-quotes {
          display: grid;
          gap: 16px;
        }
        .quote-card {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #fdfcf9;
          padding: 20px;
          display: grid;
          gap: 14px;
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .quote-card blockquote {
          margin: 0;
          font-size: 15px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .quote-card figcaption {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #6b6b6b;
        }
        .quote-name {
          font-weight: 600;
          color: #1a1a1a;
          letter-spacing: 0.12em;
        }
        .quote-detail {
          font-size: 11px;
        }
        .quote-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px rgba(20, 20, 20, 0.08);
        }
        .testimonials-stats {
          display: grid;
          gap: 16px;
          align-content: start;
        }
        .stats-card {
          border-radius: 24px;
          border: 1px solid #e4e1da;
          background: #f5f1ea;
          padding: 20px;
          display: grid;
          gap: 16px;
        }
        .stat-row {
          display: grid;
          gap: 6px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .stat-label {
          font-size: 14px;
          color: #4b4b4b;
        }
        .testimonials-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          background-color: #1a1a1a;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          width: fit-content;
        }
        @media (prefers-reduced-motion: reduce) {
          .quote-card,
          .quote-card:hover {
            transition: none;
            transform: none;
          }
        }
        @media (min-width: 900px) {
          .testimonials-grid {
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
            gap: 32px;
            align-items: start;
          }
          .testimonials-heading h2 {
            font-size: 36px;
          }
        }
      `}</style>
    </section>
  );
}
