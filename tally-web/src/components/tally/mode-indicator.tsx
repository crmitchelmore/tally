"use client";

/**
 * Mode Indicator Component
 *
 * Shows the current data mode (local-only vs synced) with upgrade CTA.
 */

import { useAppMode } from "@/providers/app-mode-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HardDrive, Cloud, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ModeIndicatorProps {
  /** Show upgrade button (default: true for local-only) */
  showUpgrade?: boolean;
  /** Compact mode - just the badge, no text */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function ModeIndicator({
  showUpgrade = true,
  compact = false,
  className = "",
}: ModeIndicatorProps) {
  const { mode, isReady, isLocalOnly } = useAppMode();

  // Don't render until mode is determined
  if (!isReady || !mode) {
    return null;
  }

  // In synced mode, we typically don't show an indicator
  // unless explicitly requested
  if (!isLocalOnly && !compact) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isLocalOnly ? "secondary" : "default"}
              className={`cursor-default ${className}`}
            >
              {isLocalOnly ? (
                <HardDrive className="h-3 w-3" />
              ) : (
                <Cloud className="h-3 w-3" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isLocalOnly
                ? "Data stored locally on this device"
                : "Data synced across devices"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm ${className}`}
    >
      <HardDrive className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">Local-only mode</span>
      {showUpgrade && (
        <Link href="/sign-up">
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
            Upgrade to sync
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

/**
 * Local-only banner for settings or prominent display
 */
export function LocalOnlyBanner({ className = "" }: { className?: string }) {
  const { isLocalOnly, isReady } = useAppMode();

  if (!isReady || !isLocalOnly) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30 ${className}`}
    >
      <div className="flex items-start gap-3">
        <HardDrive className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-900 dark:text-amber-100">
            Local-only mode
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Your data is stored only on this device. Create an account to sync
            across devices and access community features.
          </p>
          <Link href="/sign-up" className="mt-3 inline-block">
            <Button size="sm" className="gap-2">
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
