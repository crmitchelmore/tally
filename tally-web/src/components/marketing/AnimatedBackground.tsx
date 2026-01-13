"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated gradient background for hero sections.
 * Inspired by Convex.dev's subtle animated backgrounds.
 */
export function AnimatedGradientBg({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // Draw animated gradient blobs
      const blobs = [
        {
          x: w * 0.3 + Math.sin(time * 0.5) * 50,
          y: h * 0.4 + Math.cos(time * 0.3) * 30,
          radius: Math.min(w, h) * 0.4,
          color: "rgba(194, 89, 74, 0.08)", // tally-cross color
        },
        {
          x: w * 0.7 + Math.cos(time * 0.4) * 40,
          y: h * 0.3 + Math.sin(time * 0.6) * 35,
          radius: Math.min(w, h) * 0.35,
          color: "rgba(245, 158, 11, 0.06)", // amber
        },
        {
          x: w * 0.5 + Math.sin(time * 0.35) * 60,
          y: h * 0.7 + Math.cos(time * 0.45) * 40,
          radius: Math.min(w, h) * 0.3,
          color: "rgba(253, 224, 71, 0.05)", // yellow
        },
      ];

      blobs.forEach((blob) => {
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      time += 0.01;
      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div className="relative">
      {/* Animated canvas background */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      />

      {/* Static fallback gradient for reduced motion */}
      {prefersReducedMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,oklch(0.55_0.22_25_/_0.12),transparent_60%)]"
        />
      )}

      {children}
    </div>
  );
}

/**
 * Floating particles effect for visual interest.
 */
export function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }))
  );

  if (prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-[color:var(--tally-cross)]/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
