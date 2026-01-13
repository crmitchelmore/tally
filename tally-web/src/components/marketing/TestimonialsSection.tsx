"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

// Placeholder testimonials (replace with real ones)
const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Finally, a habit tracker that doesn't make me feel guilty. Just tap and move on.",
    author: "Alex Chen",
    role: "Software Engineer",
  },
  {
    id: 2,
    quote: "I've tried dozens of apps. Tally is the only one that stuck because it's so simple.",
    author: "Sarah Kim",
    role: "Product Designer",
  },
  {
    id: 3,
    quote: "The real-time sync is magic. I log on my phone and see it instantly on my laptop.",
    author: "Marcus Johnson",
    role: "Fitness Coach",
  },
  {
    id: 4,
    quote: "Love the confetti on milestones. Small delights make a big difference.",
    author: "Emily Rodriguez",
    role: "UX Researcher",
  },
];

export function TestimonialsSection() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((i) => (i + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  const goTo = useCallback((index: number) => {
    setActiveIndex((current) => {
      setDirection(index > current ? 1 : -1);
      return index;
    });
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % testimonials.length);
  }, []);

  const current = testimonials[activeIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.5 },
              })}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Loved by people building habits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands who track their progress with Tally
          </p>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative mx-auto mt-12 max-w-3xl md:mt-16">
          {/* Navigation buttons */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition-colors hover:bg-muted md:-left-12 md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition-colors hover:bg-muted md:-right-12 md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Card */}
          <div className="relative min-h-[240px] overflow-hidden rounded-2xl border bg-card p-8 shadow-sm md:p-12">
            <Quote
              className="absolute right-6 top-6 h-12 w-12 text-[color:var(--tally-cross)]/10 md:h-16 md:w-16"
              aria-hidden="true"
            />

            <AnimatePresence custom={direction} mode="wait" initial={!prefersReducedMotion}>
              <motion.div
                key={current.id}
                custom={direction}
                variants={variants}
                initial={prefersReducedMotion ? "center" : "enter"}
                animate="center"
                exit="exit"
                transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeInOut" }}
              >
                <blockquote className="relative text-lg font-medium md:text-xl">
                  &quot;{current.quote}&quot;
                </blockquote>

                <div className="mt-6 flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--tally-cross)]/10 text-lg font-semibold text-[color:var(--tally-cross)]">
                    {current.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{current.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {current.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === activeIndex
                    ? "bg-[color:var(--tally-cross)]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
