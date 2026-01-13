"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface StatsItem {
  value: number;
  suffix?: string;
  label: string;
}

// TODO: Replace with real data from API or environment config before launch
const stats: StatsItem[] = [
  { value: 50, suffix: "K+", label: "Tallies logged" },
  { value: 2, suffix: "K+", label: "Active users" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 3, label: "Platforms" },
];

export function StatsBar() {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <section className="border-y bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
          onViewportEnter={() => setIsVisible(true)}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    animate: isVisible ? { opacity: 1, y: 0 } : {},
                    transition: { duration: 0.4, delay: index * 0.1 },
                  })}
            >
              <div className="text-3xl font-bold text-[color:var(--tally-cross)] md:text-4xl">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  isVisible={isVisible}
                  prefersReducedMotion={prefersReducedMotion ?? false}
                />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  isVisible: boolean;
  prefersReducedMotion: boolean;
}

function AnimatedNumber({
  value,
  suffix = "",
  isVisible,
  prefersReducedMotion,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // Animate from 0 to value
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased * 10) / 10);

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, value, prefersReducedMotion]);

  // Format number with appropriate decimal places
  const formatted =
    displayValue % 1 === 0
      ? displayValue.toLocaleString()
      : displayValue.toFixed(1);

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
