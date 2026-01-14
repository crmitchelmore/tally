"use client";

/**
 * Migration Dialog Component
 *
 * Shows when a user with local data signs in/up, offering to migrate their data.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAppMode } from "@/providers/app-mode-provider";
import {
  checkMigrationState,
  migrateLocalToCloud,
  skipMigration,
} from "@/lib/local-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  Cloud,
  HardDrive,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import type { MigrationCheck } from "@tally/shared-types";

interface MigrationDialogProps {
  open: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

type MigrationStep = "checking" | "choose" | "migrating" | "success" | "error";

export function MigrationDialog({
  open,
  onClose,
  onMigrationComplete,
}: MigrationDialogProps) {
  const { getToken } = useAuth();
  const { setMode, hasLocalData } = useAppMode();
  const [step, setStep] = useState<MigrationStep>("checking");
  const [migrationCheck, setMigrationCheck] = useState<MigrationCheck | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Check cloud data using Convex
  const cloudData = useQuery(api.import.checkExistingData, {});

  // Check migration state when dialog opens
  useEffect(() => {
    if (!open) return;

    const check = async () => {
      setStep("checking");
      try {
        const localHasData = await hasLocalData();
        if (!localHasData) {
          // No local data - just switch to synced mode
          setMode("synced");
          onMigrationComplete?.();
          onClose();
          return;
        }

        const state = await checkMigrationState(
          cloudData
            ? {
                hasData: cloudData.hasData,
                challengeCount: cloudData.challengeCount,
                entryCount: cloudData.entryCount,
              }
            : undefined
        );
        setMigrationCheck(state);
        setStep("choose");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to check data");
        setStep("error");
      }
    };

    check();
  }, [open, cloudData, hasLocalData, setMode, onMigrationComplete, onClose]);

  const handleMigrate = useCallback(async () => {
    setStep("migrating");
    setError(null);

    try {
      const token = await getToken({ template: "convex" });
      if (!token) {
        throw new Error("Not authenticated");
      }

      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        throw new Error("Convex URL not configured");
      }

      const result = await migrateLocalToCloud(convexUrl, token, "replace-cloud");

      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onMigrationComplete?.();
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Migration failed");
        setStep("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Migration failed");
      setStep("error");
    }
  }, [getToken, onMigrationComplete, onClose]);

  const handleSkip = useCallback(() => {
    skipMigration();
    setMode("synced");
    onMigrationComplete?.();
    onClose();
  }, [setMode, onMigrationComplete, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "checking" && (
          <>
            <DialogHeader>
              <DialogTitle>Checking your data...</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {step === "choose" && migrationCheck && (
          <>
            <DialogHeader>
              <DialogTitle>Migrate your local data?</DialogTitle>
              <DialogDescription>
                We found data stored on this device. Would you like to move it
                to your account?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Local data</p>
                  <p className="text-sm text-muted-foreground">
                    {migrationCheck.localChallengeCount} challenges,{" "}
                    {migrationCheck.localEntryCount} entries
                  </p>
                </div>
              </div>

              {migrationCheck.hasCloudData && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your account already has{" "}
                    {migrationCheck.cloudChallengeCount} challenges. Migrating
                    will replace your cloud data with local data.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleMigrate} className="w-full gap-2">
                <Cloud className="h-4 w-4" />
                Migrate to cloud
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full"
              >
                Skip and start fresh
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "migrating" && (
          <>
            <DialogHeader>
              <DialogTitle>Migrating your data...</DialogTitle>
              <DialogDescription>
                Please don&apos;t close this window.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Migration complete!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">
                Your data is now synced across all your devices.
              </p>
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle>Migration failed</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={handleMigrate} className="w-full">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full"
              >
                Skip migration
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
