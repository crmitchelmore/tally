"use client";

/**
 * RequiresAccount Component
 *
 * Gates content that requires an authenticated account.
 * Shows a friendly message for local-only users with CTA to create account.
 */

import { useAppMode } from "@/providers/app-mode-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface RequiresAccountProps {
  children: ReactNode;
  /** Feature name to display in the gate message */
  featureName?: string;
  /** Custom message to display */
  message?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Custom class name for the gate */
  className?: string;
}

/**
 * Wrapper that gates content requiring an account.
 *
 * Usage:
 * ```tsx
 * <RequiresAccount featureName="Community">
 *   <CommunityBrowser />
 * </RequiresAccount>
 * ```
 */
export function RequiresAccount({
  children,
  featureName = "This feature",
  message,
  icon,
  className = "",
}: RequiresAccountProps) {
  const { isLocalOnly, isReady } = useAppMode();

  // Show loading state while mode is being determined
  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // In synced mode, show the content
  if (!isLocalOnly) {
    return <>{children}</>;
  }

  // In local-only mode, show the gate
  return (
    <div
      className={`flex min-h-[300px] items-center justify-center p-4 ${className}`}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {icon || <Lock className="h-8 w-8 text-muted-foreground" />}
          </div>
          <CardTitle>{featureName} requires an account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {message ||
              `${featureName} is only available to signed-in users. Create a free account to access this feature and sync your data across devices.`}
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/sign-up">
              <Button className="w-full gap-2">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" className="w-full">
                Already have an account? Sign in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Community-specific gate with themed styling
 */
export function RequiresCommunityAccess({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequiresAccount
      featureName="Community"
      message="Join the Tally community to discover public challenges, follow other users, and appear on leaderboards."
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
    >
      {children}
    </RequiresAccount>
  );
}
