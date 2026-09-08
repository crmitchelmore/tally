"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/** A single, interruptible acknowledgement when a saved count increases. */
export function useTallyFeedback<T extends HTMLElement>(value: number) {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const increased = value > previous.current;
    previous.current = value;
    if (!increased || reduceMotion || !ref.current?.animate) return;
    const animation = ref.current.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.035)", offset: 0.35 }, { transform: "scale(1)" }],
      { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    return () => animation.cancel();
  }, [value, reduceMotion]);

  return ref;
}
