"use client";

/**
 * TestimonialsStats - Social proof section for the landing page
 * 
 * Displays 2-3 short quotes or metrics to build trust quickly without noise.
 * Follows design philosophy: calm, high-contrast, focused, accessible.
 */

// Example metrics / testimonials (placeholder content that feels authentic)
const stats = [
  {
    value: "25,000+",
    label: "Marks logged",
    description: "Small wins, visible progress",
  },
  {
    value: "94%",
    label: "Hit their pace",
    description: "When checking in daily",
  },
  {
    value: "12 sec",
    label: "Average entry time",
    description: "Open, tap, done",
  },
];

const testimonials = [
  {
    quote: "Finally, a tracker that doesn't guilt-trip me for missing a day.",
    author: "Alex R.",
    context: "Running 1,000 miles",
  },
  {
    quote: "The tally marks are oddly satisfying. I actually want to log my progress.",
    author: "Jordan M.",
    context: "Learning Spanish",
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
