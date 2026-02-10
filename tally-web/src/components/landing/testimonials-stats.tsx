"use client";

/**
 * TestimonialsStats — Social proof section
 * Calm, high-contrast, focused, accessible.
 */

const stats = [
  {
    value: "142,000+",
    label: "Tally marks logged",
    description: "Small wins, visible progress",
  },
  {
    value: "94%",
    label: "Hit their pace",
    description: "When checking in daily",
  },
  {
    value: "< 10 sec",
    label: "Average entry time",
    description: "Open, tap, done",
  },
];

const testimonials = [
  {
    quote: "Finally, a tracker that doesn't guilt-trip me for missing a day. Just honest progress.",
    author: "Alex R.",
    context: "Running 1,000 miles",
  },
  {
    quote: "The tally marks are oddly satisfying — I actually look forward to logging my sessions.",
    author: "Jordan M.",
    context: "Learning guitar",
  },
  {
    quote: "I run it on my phone and laptop. Everything stays in sync without me thinking about it.",
    author: "Sam K.",
    context: "Daily meditation",
  },
];

export function TestimonialsStats() {
  return (
    <section className="testimonials-stats" aria-label="Why people use Tally">
      {/* Stats row */}
      <div className="ts-stats-row">
        {stats.map((stat) => (
          <div key={stat.label} className="ts-stat-card">
            <div className="ts-stat-value">{stat.value}</div>
            <div className="ts-stat-label">{stat.label}</div>
            <div className="ts-stat-description">{stat.description}</div>
          </div>
        ))}
      </div>

      {/* Testimonials row */}
      <div className="ts-quotes-row">
        {testimonials.map((testimonial) => (
          <blockquote key={testimonial.author} className="ts-quote-card">
            {/* Tally mark decoration */}
            <div className="ts-quote-tally" aria-hidden="true">
              <span className="ts-quote-stroke" />
              <span className="ts-quote-stroke" />
              <span className="ts-quote-stroke" />
              <span className="ts-quote-stroke" />
              <span className="ts-quote-slash" />
            </div>
            <p className="ts-quote-text">&ldquo;{testimonial.quote}&rdquo;</p>
            <footer className="ts-quote-footer">
              <cite className="ts-quote-author">{testimonial.author}</cite>
              <span className="ts-quote-context">{testimonial.context}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
