"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface VideoShowcaseProps {
  /** Video source URL (mp4, webm) or animated gif */
  src: string;
  /** Poster image shown before video loads */
  poster?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Aspect ratio of the video container */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "9/16";
  /** Whether to show playback controls */
  controls?: boolean;
  /** Whether video should loop */
  loop?: boolean;
  /** Whether video autoplays when in view */
  autoPlay?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Video showcase component with autoplay-on-scroll, smooth reveal animation,
 * and accessibility support. Perfect for marketing pages.
 */
export function VideoShowcase({
  src,
  poster,
  alt,
  aspectRatio = "16/9",
  controls = false,
  loop = true,
  autoPlay = true,
  className = "",
}: VideoShowcaseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-10%" });
  const prefersReducedMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = useState(false);

  // Autoplay when in view (respects reduced motion)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    if (isInView && !prefersReducedMotion) {
      video.play().catch(() => {
        // Autoplay was prevented, that's okay
      });
    } else {
      video.pause();
    }
  }, [isInView, autoPlay, prefersReducedMotion]);

  const isGif = src.endsWith(".gif");

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl bg-muted ${className}`}
      style={{ aspectRatio }}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {isGif ? (
        // Render animated gif
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        // Render video
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          playsInline
          loop={loop}
          controls={controls}
          className="h-full w-full object-cover"
          onLoadedData={() => setIsLoaded(true)}
          aria-label={alt}
        />
      )}

      {/* Loading shimmer */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
      )}

      {/* Optional play indicator for videos with controls off */}
      {!isGif && !controls && !isInView && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <svg className="ml-1 h-6 w-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface FeatureVideoCardProps {
  /** Video/gif source */
  src: string;
  /** Poster image */
  poster?: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Whether video is on the left or right */
  videoPosition?: "left" | "right";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Feature card with embedded video demo - like modern SaaS marketing pages.
 */
export function FeatureVideoCard({
  src,
  poster,
  title,
  description,
  videoPosition = "left",
  className = "",
}: FeatureVideoCardProps) {
  const isLeft = videoPosition === "left";

  return (
    <motion.div
      className={`grid items-center gap-8 md:grid-cols-2 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Video */}
      <div className={isLeft ? "md:order-1" : "md:order-2"}>
        <VideoShowcase
          src={src}
          poster={poster}
          alt={title}
          aspectRatio="4/3"
          className="shadow-lg"
        />
      </div>

      {/* Content */}
      <div className={isLeft ? "md:order-2" : "md:order-1"}>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
