"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { UndoToast } from "@/components/ui/undo-toast";
import { ChallengeList } from "@/components/challenges";
import { DashboardHighlights, PersonalRecords, WeeklySummary, ProgressGraph, BurnUpChart } from "@/components/stats";
import { FollowedChallengesSection, CommunitySection } from "@/components/community";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useChallenges } from "@/hooks/use-challenges";
import { useStats, useEntries } from "@/hooks/use-stats";
import type { Challenge, DashboardConfig } from "@/app/api/v1/_lib/types";

interface DeletedChallenge {
  id: string;
  name: string;
}

// Default dashboard panel visibility
const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  panels: {
    highlights: true,
    personalRecords: true,
    progressGraph: true,
    burnUpChart: true,
    setsStats: true,
  },
};

export default function AppPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [deletedChallenge, setDeletedChallenge] = useState<DeletedChallenge | null>(null);
  const [panelConfig, setPanelConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const configLoadedFromApi = useRef(false);

  const basePanelOrder = ["highlights", "personalRecords", "progressGraph", "burnUpChart"] as const;
  type PanelKey = typeof basePanelOrder[number];
  const panelOrder: PanelKey[] = panelConfig.order?.length
    ? panelConfig.order
    : [...basePanelOrder];
  const normalizedPanelOrder: PanelKey[] = (() => {
    const order = panelConfig.order?.length ? panelConfig.order : basePanelOrder;
    const seen = new Set<PanelKey>(order);
    return [...order, ...basePanelOrder.filter((panel) => !seen.has(panel))];
  })();

  // Load config from API (primary) with localStorage fallback
  useEffect(() => {
    const stored = sessionStorage.getItem("deletedChallenge");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDeletedChallenge(parsed);
        sessionStorage.removeItem("deletedChallenge");
      } catch {
        // Ignore parse errors
      }
    }
    
    // Load from localStorage first (instant)
    const savedConfig = localStorage.getItem("dashboardConfig");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        const merged = {
          ...DEFAULT_DASHBOARD_CONFIG,
          ...parsed,
          panels: {
            ...DEFAULT_DASHBOARD_CONFIG.panels,
            ...parsed.panels,
          },
        };
        setPanelConfig(merged);
      } catch {
        // Use default
      }
    }
    
    // Then fetch from API (authoritative)
    if (isLoaded && isSignedIn) {
      fetch("/api/v1/auth/user/preferences")
        .then(res => res.json())
        .then(data => {
          if (data.dashboardConfig?.panels) {
            const merged = {
              ...DEFAULT_DASHBOARD_CONFIG,
              ...data.dashboardConfig,
              panels: {
                ...DEFAULT_DASHBOARD_CONFIG.panels,
                ...data.dashboardConfig.panels,
              },
            };
            setPanelConfig(merged);
            localStorage.setItem("dashboardConfig", JSON.stringify(merged));
            configLoadedFromApi.current = true;
          }
        })
        .catch(() => {
          // Use localStorage fallback
        });
    }
  }, [isLoaded, isSignedIn]);

  // Save panel config when it changes
  const updatePanelConfig = useCallback((key: keyof DashboardConfig["panels"], value: boolean) => {
    setPanelConfig(prev => {
      const newConfig = { ...prev, panels: { ...prev.panels, [key]: value } };
      // Save to localStorage (instant)
      localStorage.setItem("dashboardConfig", JSON.stringify(newConfig));
      // Sync to API (background)
      fetch("/api/v1/auth/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardConfig: newConfig }),
      }).catch(() => {
        // Silently fail - localStorage has the value
      });
      return newConfig;
    });
  }, []);

  const movePanel = useCallback((panel: PanelKey, direction: -1 | 1) => {
    setPanelConfig(prev => {
      const order = prev.order?.length ? [...prev.order] : [...normalizedPanelOrder];
      const index = order.indexOf(panel);
      if (index < 0) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= order.length) return prev;
      order.splice(index, 1);
      order.splice(newIndex, 0, panel);
      const newConfig = { ...prev, order };
      localStorage.setItem("dashboardConfig", JSON.stringify(newConfig));
      fetch("/api/v1/auth/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardConfig: newConfig }),
      }).catch(() => {});
      return newConfig;
    });
  }, [normalizedPanelOrder]);

  // Data fetching with SWR - shows cached data immediately
  const isReady = isLoaded && isSignedIn;
  const { 
    challenges, 
    isLoading: challengesLoading, 
    error, 
    createChallenge, 
    refresh: refreshChallenges 
  } = useChallenges(isReady);
  
  const { 
    dashboardStats, 
    personalRecords, 
    isLoading: statsLoading,
    refresh: refreshStats 
  } = useStats(isReady);
  
  const { 
    entries, 
    refresh: refreshEntries 
  } = useEntries(isReady);

  // Map challenge IDs to names for personal records display
  const challengeNames = useMemo(() => {
    const map = new Map<string, string>();
    challenges.forEach(({ challenge }) => {
      map.set(challenge.id, challenge.name);
    });
    return map;
  }, [challenges]);

  // Map challenges by ID for weekly summary
  const challengesById = useMemo(() => {
    const map = new Map<string, Challenge>();
    challenges.forEach(({ challenge }) => {
      map.set(challenge.id, challenge);
    });
    return map;
  }, [challenges]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refreshChallenges();
    refreshStats();
    refreshEntries();
  }, [refreshChallenges, refreshStats, refreshEntries]);

  // Restore deleted challenge
  const handleRestoreChallenge = useCallback(async () => {
    if (!deletedChallenge) return;
    
    const res = await fetch(`/api/v1/challenges/${deletedChallenge.id}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to restore challenge");
    }

    setDeletedChallenge(null);
    handleRefresh();
  }, [deletedChallenge, handleRefresh]);

  // Show signed-out CTA if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="space-y-8">
        <section className="text-center py-16">
          <TallyMark count={5} size="lg" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
            Track what matters.
          </h1>
          <p className="mt-3 text-base text-muted max-w-md mx-auto">
            Create challenges, log entries, and watch your progress unfold with
            calm, tactile tallies.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border font-semibold hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section with weekly summary button */}
      <section className="py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
            </h1>
            <p className="mt-1 text-base text-muted">
              Your tallies are ready. Create a challenge or log progress below.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWeeklySummary(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl border border-border text-sm font-medium text-ink hover:bg-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Weekly Summary
            </button>
            {/* Panel config toggle */}
            <div className="relative">
              <button
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                className="px-3 py-2 rounded-xl border border-border text-sm text-muted hover:text-ink hover:bg-border/50 transition-colors"
                title="Configure dashboard panels"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
                {showConfigMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg z-50 p-2">
                    <p className="px-3 py-2 text-xs font-medium text-muted uppercase">Show panels</p>
                    {[
                      { key: "highlights", label: "Highlights" },
                      { key: "personalRecords", label: "Personal Records" },
                      { key: "progressGraph", label: "Progress Graph" },
                      { key: "burnUpChart", label: "Goal Progress" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-border/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={panelConfig.panels[key as keyof DashboardConfig["panels"]]}
                          onChange={(e) => updatePanelConfig(key as keyof DashboardConfig["panels"], e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-ink">{label}</span>
                      </label>
                    ))}
                    <p className="px-3 py-2 text-xs font-medium text-muted uppercase">Order</p>
                    {normalizedPanelOrder.map((panel) => (
                      <div key={panel} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-border/50">
                        <span className="text-sm text-ink">
                          {panel === "highlights" && "Highlights"}
                          {panel === "personalRecords" && "Personal Records"}
                          {panel === "progressGraph" && "Progress Graph"}
                          {panel === "burnUpChart" && "Goal Progress"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => movePanel(panel, -1)}
                            className="text-xs text-muted hover:text-ink"
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => movePanel(panel, 1)}
                            className="text-xs text-muted hover:text-ink"
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Challenges list - shown first when empty for better UX */}
      <ChallengeList
        challenges={challenges}
        loading={challengesLoading}
        error={error}
        onCreateChallenge={createChallenge}
        onRefresh={handleRefresh}
      />

      {/* Dashboard highlights - only show when user has data and panel enabled */}
      {challenges.length > 0 && (
        <>
          {normalizedPanelOrder.map((panel) => {
            switch (panel) {
              case "highlights":
                return panelConfig.panels.highlights ? (
                  <DashboardHighlights key={panel} stats={dashboardStats} loading={statsLoading} />
                ) : null;
              case "personalRecords":
                return panelConfig.panels.personalRecords ? (
                  <PersonalRecords 
                    key={panel}
                    records={personalRecords} 
                    loading={statsLoading} 
                    challengeNames={challengeNames}
                  />
                ) : null;
              case "progressGraph":
                return panelConfig.panels.progressGraph && entries.length > 0 ? (
                  <ProgressGraph key={panel} entries={entries} challenges={challengesById} />
                ) : null;
              case "burnUpChart":
                return panelConfig.panels.burnUpChart && challenges.length > 0 ? (
                  <div key={panel} className="space-y-6">
                    <h2 className="text-lg font-semibold text-ink">Goal Progress</h2>
                    {challenges.slice(0, 3).map(({ challenge }) => (
                      <BurnUpChart 
                        key={challenge.id}
                        entries={entries.filter(e => e.challengeId === challenge.id)} 
                        challenge={challenge}
                      />
                    ))}
                  </div>
                ) : null;
              default:
                return null;
            }
          })}
        </>
      )}

      {/* Followed challenges */}
      <FollowedChallengesSection onRefresh={handleRefresh} />


      {/* Weekly summary modal */}
      <WeeklySummary
        entries={entries}
        challenges={challengesById}
        open={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
      />

      {/* Undo toast for deleted challenge */}
      {deletedChallenge && (
        <UndoToast
          message={`"${deletedChallenge.name}" deleted`}
          onUndo={handleRestoreChallenge}
          onDismiss={() => setDeletedChallenge(null)}
        />
      )}
    </div>
  );
}
