"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PhoneFrameProps {
  children: ReactNode;
  platform?: "ios" | "android";
  className?: string;
}

/**
 * A realistic phone frame mockup for showcasing mobile app screenshots/videos.
 * Styled to match modern marketing pages (Linear, Vercel, Stripe style).
 */
export function PhoneFrame({ children, platform = "ios", className = "" }: PhoneFrameProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`}
      {...(prefersReducedMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-50px" },
            transition: { duration: 0.5, ease: "easeOut" },
          })}
    >
      {/* Phone frame */}
      <div className="relative mx-auto w-[280px] rounded-[40px] border-[8px] border-gray-900 bg-gray-900 p-1 shadow-2xl dark:border-gray-700">
        {/* Dynamic island / notch */}
        {platform === "ios" && (
          <div className="absolute left-1/2 top-3 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        )}
        
        {/* Screen area */}
        <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-gray-950">
          {/* Status bar simulation */}
          <div className="flex h-8 items-center justify-between bg-black/5 px-6 text-[10px] font-medium text-gray-600 dark:bg-white/5 dark:text-gray-400">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
              </svg>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
              <svg className="h-4 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
              </svg>
            </div>
          </div>
          
          {/* Content area */}
          <div className="aspect-[9/19.5] w-full overflow-hidden">
            {children}
          </div>
          
          {/* Home indicator */}
          {platform === "ios" && (
            <div className="flex h-6 items-center justify-center bg-black/5 dark:bg-white/5">
              <div className="h-1 w-32 rounded-full bg-gray-400 dark:bg-gray-600" />
            </div>
          )}
        </div>
      </div>
      
      {/* Subtle reflection effect */}
      <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
    </motion.div>
  );
}

/**
 * A minimal floating phone frame for inline showcases.
 */
export function PhoneFrameMinimal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[240px] ${className}`}>
      <div className="rounded-[32px] border-[6px] border-gray-800 bg-gray-800 p-0.5 shadow-xl dark:border-gray-600">
        <div className="overflow-hidden rounded-[26px] bg-white dark:bg-gray-950">
          <div className="aspect-[9/19.5] w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
