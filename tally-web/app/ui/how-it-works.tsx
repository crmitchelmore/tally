import Link from "next/link";

export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-heading">
        <p className="how-it-works-eyebrow">How it works</p>
        <h2 id="how-it-works-title">Three calm steps from intent to pace.</h2>
        <p className="how-it-works-subhead">
          Create a challenge, log your marks, and see your pace without pressure.
        </p>
      </div>
      <div className="how-it-works-grid">
        <article className="how-it-works-card">
          <div className="how-it-works-step">
            <span className="step-number">01</span>
            <span className="step-label">Create a challenge</span>
            <span className="step-icon" aria-hidden="true" />
          </div>
          <p className="how-it-works-copy">
            Name what matters, set a target, and pick the pace.
          </p>
          <div className="how-it-works-illustration" aria-hidden="true">
            <div className="mini-card">
              <div className="mini-row">
                <span className="mini-title">Read 20 pages</span>
                <span className="mini-chip">Public</span>
              </div>
              <div className="mini-row">
                <span className="mini-label">Target</span>
                <span className="mini-value">20 / day</span>
              </div>
              <div className="mini-row">
                <span className="mini-label">Start</span>
                <span className="mini-value">Today</span>
              </div>
            </div>
          </div>
        </article>
        <article className="how-it-works-card">
          <div className="how-it-works-step">
            <span className="step-number">02</span>
            <span className="step-label">Log your entries</span>
            <span className="step-icon" aria-hidden="true" />
          </div>
          <p className="how-it-works-copy">
            Tap +1 to draw a mark. Notes stay close when you need them.
          </p>
          <div className="how-it-works-illustration" aria-hidden="true">
            <div className="tally-preview">
              {Array.from({ length: 4 }).map((_, index) => (
                <span key={index} className="ink-line" />
              ))}
              <span className="ink-line slash" />
            </div>
            <span className="mini-pill">+1</span>
          </div>
        </article>
        <article className="how-it-works-card">
          <div className="how-it-works-step">
            <span className="step-number">03</span>
            <span className="step-label">See your pace</span>
            <span className="step-icon" aria-hidden="true" />
          </div>
          <p className="how-it-works-copy">
            Pace, streaks, and quiet signals show where you stand.
          </p>
          <div className="how-it-works-illustration" aria-hidden="true">
            <div className="pace-card">
              <div className="pace-row">
                <span className="mini-label">Weekly pace</span>
                <span className="mini-chip muted">On pace</span>
              </div>
              <div className="pace-bars">
                {[22, 34, 28, 40, 36].map((height, index) => (
                  <span
                    key={index}
                    className="pace-bar"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="how-it-works-cta">
        <Link href="/app">Open the app</Link>
        <span className="how-it-works-secondary">
          Already tracking? <Link href="/sign-in">Sign in</Link>
        </span>
      </div>
        <style>{`
          .how-it-works {
            width: min(1100px, 100%);
            display: grid;
            gap: 28px;
            position: relative;
          }
          .how-it-works::before {
            content: "";
            position: absolute;
            inset: 120px 0 auto;
            height: 160px;
            background: radial-gradient(
                circle at 20% 50%,
                rgba(178, 31, 36, 0.08),
                transparent 55%
              ),
              radial-gradient(
                circle at 80% 50%,
                rgba(26, 26, 26, 0.08),
                transparent 50%
              );
            pointer-events: none;
          }
          .how-it-works-heading h2 {
            margin: 0;
            font-size: 32px;
            line-height: 1.2;
        }
        .how-it-works-eyebrow {
          margin: 0 0 12px;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6b6b;
        }
        .how-it-works-subhead {
          margin: 12px 0 0;
          color: #4b4b4b;
          max-width: 520px;
        }
          .how-it-works-grid {
            display: grid;
            gap: 20px;
            position: relative;
            z-index: 1;
          }
          .how-it-works-card {
            border-radius: 24px;
            border: 1px solid #e4e1da;
            background: #fdfcf9;
            padding: 20px;
            display: grid;
            gap: 14px;
            box-shadow: 0 14px 30px rgba(20, 20, 20, 0.06);
            transition: transform 180ms ease, box-shadow 180ms ease;
          }
          .how-it-works-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 22px 40px rgba(20, 20, 20, 0.08);
          }
          .how-it-works-step {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
            color: #6b6b6b;
          }
          .step-icon {
            margin-left: auto;
            width: 28px;
            height: 28px;
            border-radius: 10px;
            border: 1px solid #d9d2c8;
            background: linear-gradient(135deg, #f8f4ee, #f0e7dc);
            position: relative;
          }
          .step-icon::before,
          .step-icon::after {
            content: "";
            position: absolute;
            border-radius: 999px;
            background: #1a1a1a;
          }
          .step-icon::before {
            width: 4px;
            height: 16px;
            left: 8px;
            top: 6px;
          }
          .step-icon::after {
            width: 16px;
            height: 4px;
            right: 6px;
            top: 12px;
            background: #b21f24;
            transform: rotate(-18deg);
          }
          .step-number {
            border-radius: 999px;
            border: 1px solid #d9d2c8;
            padding: 6px 10px;
          font-weight: 600;
          color: #1a1a1a;
          background: #f8f4ee;
        }
        .step-label {
          font-weight: 600;
        }
        .how-it-works-copy {
          margin: 0;
          color: #4b4b4b;
          font-size: 15px;
        }
          .how-it-works-illustration {
            background: #f5f1ea;
            border-radius: 18px;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            position: relative;
            overflow: hidden;
          }
          .how-it-works-illustration::after {
            content: "";
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
              120deg,
              rgba(26, 26, 26, 0.04),
              rgba(26, 26, 26, 0.04) 1px,
              transparent 1px,
              transparent 6px
            );
            opacity: 0.3;
            pointer-events: none;
          }
          .mini-card {
            display: grid;
            gap: 10px;
            width: 100%;
            position: relative;
            z-index: 1;
          }
        .mini-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .mini-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .mini-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #6b6b6b;
        }
        .mini-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .mini-chip {
          border: 1px solid #1a1a1a;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          color: #1a1a1a;
          background: #ffffff;
        }
        .mini-chip.muted {
          border-color: #c9c0b2;
          color: #6b6b6b;
          background: #fdfcf9;
        }
          .tally-preview {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            position: relative;
            z-index: 1;
          }
          .ink-line {
            width: 6px;
            height: 44px;
            background: #1a1a1a;
            border-radius: 999px;
            opacity: 0.9;
            animation: ink-rise 420ms ease-out forwards;
          }
        .ink-line.slash {
          width: 44px;
          height: 6px;
          background: #b21f24;
          transform: rotate(-18deg);
          margin: 0 4px 6px;
        }
          .mini-pill {
            border-radius: 999px;
            border: 1px solid #1a1a1a;
            padding: 6px 14px;
            font-weight: 600;
            color: #1a1a1a;
            background: #ffffff;
            position: relative;
            z-index: 1;
          }
          .pace-card {
            width: 100%;
            display: grid;
            gap: 12px;
            position: relative;
            z-index: 1;
          }
        .pace-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pace-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          min-height: 46px;
        }
        .pace-bar {
          width: 10px;
          background: #1a1a1a;
          border-radius: 999px;
          opacity: 0.85;
          animation: bar-rise 420ms ease-out forwards;
        }
          .how-it-works-cta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 16px;
          }
        .how-it-works-cta a:first-child {
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
        }
        .how-it-works-cta a:focus-visible,
        .how-it-works-secondary a:focus-visible {
          outline: 2px solid #b21f24;
          outline-offset: 3px;
        }
        .how-it-works-secondary {
          color: #6b6b6b;
          font-size: 14px;
        }
        .how-it-works-secondary a {
          color: #b21f24;
          text-decoration: none;
          font-weight: 600;
        }
        @keyframes ink-rise {
          from {
            transform: translateY(6px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 0.9;
          }
        }
        @keyframes bar-rise {
          from {
            transform: scaleY(0.6);
            opacity: 0.4;
          }
          to {
            transform: scaleY(1);
            opacity: 0.85;
          }
        }
          @media (prefers-reduced-motion: reduce) {
            .ink-line,
            .pace-bar,
            .how-it-works-card {
              animation: none;
              transition: none;
            }
            .how-it-works-card:hover {
              transform: none;
              box-shadow: 0 14px 30px rgba(20, 20, 20, 0.06);
            }
          }
        @media (min-width: 900px) {
          .how-it-works-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .how-it-works-heading h2 {
            font-size: 36px;
          }
        }
      `}</style>
    </section>
  );
}
