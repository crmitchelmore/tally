"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Apple, Smartphone } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PhoneFrame } from "./PhoneFrame";

interface AppShowcaseProps {
  className?: string;
}

/**
 * Multi-platform app showcase section with phone mockups.
 * Shows iOS and Android apps side by side with video/screenshot content.
 */
export function AppShowcase({ className = "" }: AppShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();

  const fadeInUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 },
      };

  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div className="mx-auto max-w-2xl text-center" {...fadeInUp}>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Available everywhere you are
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Track your progress on web, iOS, and Android. Your data syncs instantly across all devices.
          </p>
        </motion.div>

        {/* Phone mockups */}
        <div className="mt-12 flex flex-col items-center justify-center gap-8 md:mt-16 md:flex-row md:gap-12 lg:gap-20">
          {/* iOS Phone */}
          <motion.div
            className="text-center"
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, x: -30 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.6, delay: 0.1 },
                })}
          >
            <PhoneFrame platform="ios">
              {/* Placeholder for iOS app screenshot/video */}
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:from-orange-950/20 dark:to-amber-950/20">
                <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-gray-900/80">
                  <div className="text-4xl font-bold text-[color:var(--tally-cross)]">12</div>
                  <div className="mt-1 text-xs text-muted-foreground">Push-ups today</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-[color:var(--tally-cross)]" />
                  <div className="h-2 w-2 rounded-full bg-[color:var(--tally-cross)]/60" />
                  <div className="h-2 w-2 rounded-full bg-[color:var(--tally-cross)]/30" />
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Tap +1 to log</div>
              </div>
            </PhoneFrame>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Apple className="h-5 w-5" />
              <span className="font-medium">iOS</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
            <Link href="/ios" className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                Learn more
              </Button>
            </Link>
          </motion.div>

          {/* Android Phone */}
          <motion.div
            className="text-center"
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, x: 30 },
                  whileInView: { opacity: 1, x: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.6, delay: 0.2 },
                })}
          >
            <PhoneFrame platform="android">
              {/* Placeholder for Android app screenshot/video */}
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4 dark:from-orange-950/20 dark:to-amber-950/20">
                <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur dark:bg-gray-900/80">
                  <div className="text-4xl font-bold text-[color:var(--tally-cross)]">7</div>
                  <div className="mt-1 text-xs text-muted-foreground">Pages read</div>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-1">
                  {[3, 5, 2, 7, 4, 6, 7].map((v, i) => (
                    <div
                      key={i}
                      className="rounded-sm bg-[color:var(--tally-cross)]"
                      style={{ height: `${8 + v * 4}px`, width: "8px", opacity: 0.3 + v * 0.1 }}
                    />
                  ))}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">This week</div>
              </div>
            </PhoneFrame>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">Android</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
            <Link href="/android" className="mt-3 inline-block">
              <Button variant="outline" size="sm">
                Learn more
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Web callout */}
        <motion.div
          className="mt-12 text-center md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Web app available now
            </span>
          </p>
          <Link href="/app" className="mt-4 inline-block">
            <Button className="bg-[var(--tally-cross)] text-white hover:opacity-90">
              Open web app
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

interface FeatureShowcaseProps {
  /** Video/gif source for the demo */
  videoSrc?: string;
  /** Static image fallback */
  imageSrc?: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Position of media (left or right) */
  mediaPosition?: "left" | "right";
  /** Badge text (e.g., "New", "Pro") */
  badge?: string;
  className?: string;
}

/**
 * Feature showcase with side-by-side video/image and text.
 */
export function FeatureShowcase({
  videoSrc,
  imageSrc,
  title,
  description,
  mediaPosition = "left",
  badge,
  className = "",
}: FeatureShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const isLeft = mediaPosition === "left";

  return (
    <motion.div
      className={`grid items-center gap-8 py-12 md:grid-cols-2 md:gap-12 ${className}`}
      {...(prefersReducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 30 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-100px" },
            transition: { duration: 0.6 },
          })}
    >
      {/* Media */}
      <div className={isLeft ? "md:order-1" : "md:order-2"}>
        <div className="overflow-hidden rounded-2xl border bg-muted shadow-lg">
          {videoSrc ? (
            <video
              src={videoSrc}
              autoPlay={!prefersReducedMotion}
              muted
              loop
              playsInline
              aria-label={title}
              className="aspect-video w-full object-cover"
            />
          ) : imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={title}
              className="aspect-video w-full object-cover"
            />
          ) : (
            // Placeholder
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20">
              <span className="text-muted-foreground">Demo coming soon</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={isLeft ? "md:order-2" : "md:order-1"}>
        {badge && (
          <span className="mb-3 inline-block rounded-full bg-[color:var(--tally-cross)]/10 px-3 py-1 text-xs font-medium text-[color:var(--tally-cross)]">
            {badge}
          </span>
        )}
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h3>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
