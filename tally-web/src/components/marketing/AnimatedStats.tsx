"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  /** Target number to count to */
  value: number;
  /** Duration of animation in seconds */
  duration?: number;
  /** Format function for the number display */
  format?: (n: number) => string;
  /** CSS classes for the number */
  className?: string;
  /** Optional prefix (e.g., "$", "+") */
  prefix?: string;
  /** Optional suffix (e.g., "%", "k", "+") */
  suffix?: string;
}

/**
 * Animated counter that counts up when scrolled into view.
 * Respects reduced motion preferences.
 */
export function AnimatedCounter({
  value,
  duration = 1.5,
  format = (n) => Math.round(n).toLocaleString(),
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) => format(current));

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  // Skip animation if reduced motion is preferred
  if (prefersReducedMotion) {
    return (
      <span ref={ref} className={className}>
        {prefix}{format(value)}{suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

interface StatCardProps {
  /** The statistic value */
  value: number;
  /** Label for the stat */
  label: string;
  /** Optional prefix */
  prefix?: string;
  /** Optional suffix */
  suffix?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * Animated stat card for showcasing metrics.
 */
export function StatCard({
  value,
  label,
  prefix,
  suffix,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <motion.div
      className={`rounded-2xl border bg-card p-6 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <div className="mb-3 flex justify-center text-[color:var(--tally-cross)]">
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold tracking-tight md:text-4xl">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="geist-mono"
        />
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

interface AnimatedProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Height of the bar */
  height?: number;
  /** Color of the progress bar */
  color?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Animated progress bar that fills when scrolled into view.
 */
export function AnimatedProgress({
  value,
  height = 8,
  color = "var(--tally-cross)",
  showLabel = false,
  className = "",
}: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const prefersReducedMotion = useReducedMotion();

  return (
    <div ref={ref} className={className}>
      {showLabel && (
        <div className="mb-1 text-right text-sm text-muted-foreground">
          <AnimatedCounter value={value} suffix="%" />
        </div>
      )}
      <div
        className="overflow-hidden rounded-full bg-muted"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${value}%` } : { width: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 1, ease: "easeOut", delay: 0.2 }
          }
        />
      </div>
    </div>
  );
}
