"use client";

import { TallyMark } from "@/components/ui/tally-mark";

export function ChallengeEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="challenge-empty" aria-labelledby="empty-heading">
      <div className="empty-introduction">
        <span className="eyebrow">Your next chapter starts here</span>
        <h2 id="empty-heading">Something worth<br />making time for.</h2>
        <p>No challenges yet. Pick something you want to do more of, set a target, and make your first mark.</p>
        <button onClick={onCreate} className="cta">Create Challenge</button>
      </div>
      <div className="empty-examples" aria-label="Challenge ideas">
        <p className="eyebrow">Big or small. Make it yours.</p>
        {[
          ["01", "A few more pages", "Read at your own pace."],
          ["02", "Time to move", "Count kilometres, minutes or reps."],
          ["03", "A little practice", "Make space for something you love."],
        ].map(([number, title, description]) => (
          <div className="empty-example" key={number}>
            <span className="example-number">{number}</span>
            <div><h3>{title}</h3><p>{description}</p></div>
          </div>
        ))}
        <div className="empty-signature" aria-hidden="true"><TallyMark count={5} size="md" /></div>
      </div>
    </section>
  );
}
