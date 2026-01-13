"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Plus, TrendingUp, Users } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Create a challenge",
    description: "Pick something you want to track—pushups, pages read, meditation minutes. Give it a name and you're ready.",
    icon: <Plus className="h-6 w-6" />,
  },
  {
    number: 2,
    title: "Log your progress",
    description: "Tap +1 whenever you complete a unit. It takes less than a second. No notes, no details—just a tally.",
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    number: 3,
    title: "Watch momentum build",
    description: "See your streaks grow, hit milestones, and optionally share your progress with the community.",
    icon: <Users className="h-6 w-6" />,
  },
];

export function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[color:var(--tally-cross)]/5 to-transparent"
      />

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
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps to build habits that stick
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 30 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: index * 0.15 },
                  })}
            >
              {/* Connector line (hidden on mobile, last item) */}
              {index < steps.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-[color:var(--tally-cross)]/30 to-transparent md:block"
                />
              )}

              <div className="relative rounded-2xl border bg-card p-6 shadow-sm">
                {/* Step number */}
                <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--tally-cross)] text-sm font-bold text-white">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--tally-cross)]/10 text-[color:var(--tally-cross)]">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
