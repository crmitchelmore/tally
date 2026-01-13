"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Smartphone, Monitor, Cloud, Check } from "lucide-react";

/**
 * Live sync demonstration inspired by Convex.dev.
 * Shows data syncing in real-time across devices.
 */
export function LiveSyncDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(12);
  const [syncingFrom, setSyncingFrom] = useState<"phone" | "web" | null>(null);
  const [lastSynced, setLastSynced] = useState<"phone" | "web" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-increment demo (simulates real-time updates)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      const source = Math.random() > 0.5 ? "phone" : "web";
      setSyncingFrom(source);

      // Sync animation
      timeoutRef.current = setTimeout(() => {
        setCount((c) => Math.min(99, c + 1));
        setLastSynced(source);
        setSyncingFrom(null);
      }, 400);
    }, 3000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [prefersReducedMotion]);

  const handleManualIncrement = useCallback((source: "phone" | "web") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSyncingFrom(source);
    timeoutRef.current = setTimeout(() => {
      setCount((c) => Math.min(99, c + 1));
      setLastSynced(source);
      setSyncingFrom(null);
    }, 300);
  }, []);

  return (
    <div className="relative">
      {/* Connection lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        <defs>
          <linearGradient id="sync-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--tally-cross)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="var(--tally-cross)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--tally-cross)" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Phone to cloud */}
        <motion.path
          d="M 80 100 Q 160 60, 160 80"
          stroke="url(#sync-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          animate={
            syncingFrom === "phone"
              ? { strokeDashoffset: [0, -16] }
              : { strokeDashoffset: 0 }
          }
          transition={{ duration: 0.4, repeat: syncingFrom === "phone" ? Infinity : 0 }}
        />

        {/* Cloud to web */}
        <motion.path
          d="M 160 80 Q 160 60, 240 100"
          stroke="url(#sync-gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          animate={
            syncingFrom === "web"
              ? { strokeDashoffset: [0, 16] }
              : { strokeDashoffset: 0 }
          }
          transition={{ duration: 0.4, repeat: syncingFrom === "web" ? Infinity : 0 }}
        />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Phone device */}
        <DeviceCard
          icon={<Smartphone className="h-5 w-5" />}
          label="iOS"
          count={count}
          isActive={syncingFrom === "phone" || lastSynced === "phone"}
          isSyncing={syncingFrom === "phone"}
          onClick={() => handleManualIncrement("phone")}
          prefersReducedMotion={prefersReducedMotion ?? false}
        />

        {/* Cloud indicator */}
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={syncingFrom ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-full bg-muted p-3">
            <Cloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <AnimatePresence>
            {syncingFrom && (
              <motion.span
                className="text-xs text-[color:var(--tally-cross)]"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Syncing...
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Web device */}
        <DeviceCard
          icon={<Monitor className="h-5 w-5" />}
          label="Web"
          count={count}
          isActive={syncingFrom === "web" || lastSynced === "web"}
          isSyncing={syncingFrom === "web"}
          onClick={() => handleManualIncrement("web")}
          prefersReducedMotion={prefersReducedMotion ?? false}
        />
      </div>

      {/* Sync status */}
      <motion.div
        className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Check className="h-3 w-3 text-green-500" />
        <span>Changes sync instantly across all devices</span>
      </motion.div>
    </div>
  );
}

interface DeviceCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  isActive: boolean;
  isSyncing: boolean;
  onClick: () => void;
  prefersReducedMotion: boolean;
}

function DeviceCard({
  icon,
  label,
  count,
  isActive,
  isSyncing,
  onClick,
  prefersReducedMotion,
}: DeviceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        relative rounded-xl border-2 bg-card p-4 shadow-sm transition-colors
        ${isActive ? "border-[color:var(--tally-cross)]" : "border-transparent"}
        hover:border-[color:var(--tally-cross)]/50
      `}
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      whileHover={prefersReducedMotion ? {} : { y: -2 }}
    >
      {/* Sync pulse */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-[color:var(--tally-cross)]/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>

      <motion.div
        key={count}
        className="mt-2 text-3xl font-bold text-[color:var(--tally-cross)]"
        initial={prefersReducedMotion ? {} : { scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {count}
      </motion.div>

      <div className="mt-1 text-xs text-muted-foreground">Tap to add</div>
    </motion.button>
  );
}
