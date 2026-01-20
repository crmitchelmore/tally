"use client";

import Link from "next/link";

/**
 * Steps data for the 3-step how-it-works flow
 * Matches the actual in-app experience: create → log → track
 */
const steps = [
  {
    number: 1,
    title: "Create a challenge",
    description:
      "Set your goal — daily pushups, monthly pages read, or yearly running miles. Pick a target and timeframe that works for you.",
    // Tally strokes: 1 stroke for step 1
    strokes: 1,
  },
  {
    number: 2,
    title: "Log your progress",
    description:
      "Tap to add entries whenever you complete a session. Each mark feels like drawing on paper — quick, satisfying, and permanent.",
    // Tally strokes: 2 strokes for step 2
    strokes: 2,
  },
  {
    number: 3,
    title: "See your pace",
    description:
      "Watch your tally marks grow. Know instantly if you're ahead, on track, or need to catch up — no judgment, just clarity.",
    // Tally strokes: 3 strokes for step 3
    strokes: 3,
  },
] as const;

/**
 * Step number indicator with tally stroke styling
 */
function StepNumber({ number, strokes }: { number: number; strokes: number }) {
  return (
    <div className="hiw-step-number" aria-hidden="true">
      <div className="hiw-step-strokes">
        {Array.from({ length: strokes }).map((_, i) => (
          <span key={i} className="hiw-stroke" />
        ))}
      </div>
      <span className="hiw-step-digit">{number}</span>
    </div>
  );
}

/**
 * Individual step card
 */
function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  return (
    <div className="hiw-step-card">
      <StepNumber number={step.number} strokes={step.strokes} />
      <div className="hiw-step-content">
        <h3 className="hiw-step-title">{step.title}</h3>
        <p className="hiw-step-description">{step.description}</p>
      </div>
    </div>
  );
}

/**
 * Connector line between steps (desktop only)
 */
function StepConnector() {
  return (
    <div className="hiw-connector" aria-hidden="true">
      <div className="hiw-connector-line" />
    </div>
  );
}

/**
 * HowItWorks section — 3-step flow showing the core user journey
 * Create challenge → Log entries → See pace
 */
export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="hiw-heading">
      <h2 id="hiw-heading" className="hiw-heading">
        How it works
      </h2>
      <p className="hiw-subheading">
        Three simple steps to turn daily effort into visible progress.
      </p>

      <div className="hiw-steps">
        {steps.map((step, index) => (
          <div key={step.number} className="hiw-step-wrapper">
            <StepCard step={step} index={index} />
            {index < steps.length - 1 && <StepConnector />}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="hiw-cta-wrap">
        <Link href="/app" className="hiw-cta">
          Start your first challenge
        </Link>
      </div>
    </section>
  );
}
