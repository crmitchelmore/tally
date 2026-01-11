"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion.
 * Respects the system-level `prefers-reduced-motion` media query.
 * 
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * 
 * // Skip animations when reduced motion is preferred
 * if (!prefersReducedMotion) {
 *   canvasConfetti({ ... });
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns motion variants that respect reduced motion preferences.
 * Use with Framer Motion components.
 * 
 * Usage:
 * ```tsx
 * const { shouldAnimate, tapScale, hoverY } = useMotionPreference();
 * 
 * <motion.div
 *   whileHover={shouldAnimate ? { y: hoverY } : undefined}
 *   whileTap={shouldAnimate ? { scale: tapScale } : undefined}
 * >
 * ```
 */
export function useMotionPreference() {
  const prefersReducedMotion = useReducedMotion();
  
  return {
    shouldAnimate: !prefersReducedMotion,
    // Common motion values
    tapScale: prefersReducedMotion ? 1 : 0.98,
    hoverY: prefersReducedMotion ? 0 : -4,
    hoverScale: prefersReducedMotion ? 1 : 1.01,
  };
}
