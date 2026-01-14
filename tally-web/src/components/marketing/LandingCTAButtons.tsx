"use client";

/**
 * Landing CTA Buttons
 *
 * Hero section buttons with local-only mode option.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppMode } from "@/providers/app-mode-provider";

export function LandingCTAButtons() {
  const router = useRouter();
  const { setMode } = useAppMode();

  const handleContinueLocally = () => {
    setMode("local-only");
    router.push("/app");
  };

  return (
    <div className="mt-8 flex flex-col items-start gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/sign-up">
          <Button
            size="lg"
            className="bg-[var(--tally-cross)] text-white hover:opacity-90"
          >
            Create an account <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/app">
          <Button size="lg" variant="outline">
            Open the app
          </Button>
        </Link>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleContinueLocally}
        className="text-muted-foreground hover:text-foreground"
      >
        <HardDrive className="mr-2 h-4 w-4" />
        Continue without an account
      </Button>
    </div>
  );
}
