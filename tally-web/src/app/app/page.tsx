"use client";

import Link from "next/link";
import { TallyMark } from "@/components/ui/tally-mark";
import { UndoToast } from "@/components/ui/undo-toast";
import { ChallengeList } from "@/components/challenges";
import { DashboardHighlights, PersonalRecords, WeeklySummary, ProgressGraph, BurnUpChart } from "@/components/stats";
import { FollowedChallengesSection } from "@/components/community";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { DragEvent } from "react";
import { useUser } from "@clerk/nextjs";
import { useChallenges } from "@/hooks/use-challenges";
import { useStats, useEntries } from "@/hooks/use-stats";
import type { Challenge, DashboardConfig, DashboardPanelKey } from "@/app/api/v1/_lib/types";

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
  visible: ["activeChallenges", "highlights", "personalRecords", "progressGraph", "burnUpChart"],
  hidden: [],
};

// Panel labels and order - static constants
const PANEL_LABELS: Record<DashboardPanelKey, string> = {
  activeChallenges: "Active Challenges",
  highlights: "Highlights",
  personalRecords: "Personal Records",
  progressGraph: "Progress Graph",
  burnUpChart: "Goal Progress",
};

const BASE_PANEL_ORDER: DashboardPanelKey[] = [
  "activeChallenges",
  "highlights",
  "personalRecords",
  "progressGraph",
  "burnUpChart",
];

export default function AppPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [deletedChallenge, setDeletedChallenge] = useState<DeletedChallenge | null>(null);
  const [panelConfig, setPanelConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  
  // Drag-and-drop state
  const [draggingPanel, setDraggingPanel] = useState<DashboardPanelKey | null>(null);
  const [dropTarget, setDropTarget] = useState<{ list: "visible" | "hidden"; index: number } | null>(null);
  
  const visiblePanels = useMemo(() => {
    const raw = panelConfig.visible?.length ? panelConfig.visible : BASE_PANEL_ORDER;
    const filtered = raw.filter((panel) => BASE_PANEL_ORDER.includes(panel));
    // Add any panels from BASE_PANEL_ORDER that aren't in visible or hidden
    const hiddenSet = new Set(panelConfig.hidden ?? []);
    const visibleSet = new Set(filtered);
    const missing = BASE_PANEL_ORDER.filter((panel) => !visibleSet.has(panel) && !hiddenSet.has(panel));
    return [...filtered, ...missing];
  }, [panelConfig.visible, panelConfig.hidden]);
  const hiddenPanels = useMemo(() => {
    const raw = panelConfig.hidden ?? [];
    return raw.filter((panel) => BASE_PANEL_ORDER.includes(panel) && !visiblePanels.includes(panel));
  }, [panelConfig.hidden, visiblePanels]);

  const normalizeDashboardConfig = useCallback((raw: unknown): DashboardConfig => {
    const record = (raw ?? {}) as Record<string, unknown>;
    const rawPanels = (record.panels ?? {}) as Partial<DashboardConfig["panels"]>;
    const panels = {
      ...DEFAULT_DASHBOARD_CONFIG.panels,
      ...rawPanels,
    };

    const sanitizeList = (value: unknown): DashboardPanelKey[] =>
      Array.isArray(value)
        ? value.filter((panel): panel is DashboardPanelKey => BASE_PANEL_ORDER.includes(panel))
        : [];

    const rawVisible = sanitizeList(record.visible);
    const rawHidden = sanitizeList(record.hidden);
    const rawOrder = sanitizeList(record.order);
    const order = rawOrder.length ? rawOrder : BASE_PANEL_ORDER;

    let visible = rawVisible;
    let hidden = rawHidden;

    if (visible.length === 0 && hidden.length === 0) {
      visible = order.filter((panel) =>
        panel === "activeChallenges" ? true : panels[panel]
      );
      hidden = order.filter((panel) =>
        panel !== "activeChallenges" && !panels[panel]
      );
    }

    const visibleSet = new Set(visible);
    const hiddenSet = new Set(hidden.filter((panel) => !visibleSet.has(panel)));
    const visibleOrdered = order.filter((panel) => visibleSet.has(panel));
    const hiddenOrdered = order.filter((panel) => hiddenSet.has(panel));
    const remaining = order.filter(
      (panel) => !visibleSet.has(panel) && !hiddenSet.has(panel)
    );

    return {
      panels,
      visible: [...visibleOrdered, ...remaining],
      hidden: hiddenOrdered,
    };
  }, []);

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
        const merged = normalizeDashboardConfig(parsed);
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
          if (data.dashboardConfig) {
            const merged = normalizeDashboardConfig(data.dashboardConfig);
            setPanelConfig(merged);
            localStorage.setItem("dashboardConfig", JSON.stringify(merged));
          }
        })
        .catch(() => {
          // Use localStorage fallback
        });
    }
  }, [isLoaded, isSignedIn, normalizeDashboardConfig]);

  const persistConfig = useCallback((config: DashboardConfig) => {
    localStorage.setItem("dashboardConfig", JSON.stringify(config));
    fetch("/api/v1/auth/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardConfig: config }),
    }).catch(() => {});
  }, []);

  const setPanelLists = useCallback((visible: DashboardPanelKey[], hidden: DashboardPanelKey[]) => {
    setPanelConfig(prev => {
      const newConfig: DashboardConfig = {
        ...prev,
        visible,
        hidden,
      };
      persistConfig(newConfig);
      return newConfig;
    });
  }, [persistConfig]);

  const handleDragStart = useCallback((
    event: DragEvent<HTMLDivElement>,
    panel: DashboardPanelKey,
    from: "visible" | "hidden"
  ) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({ panel, from }));
    event.dataTransfer.effectAllowed = "move";
    setDraggingPanel(panel);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingPanel(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((
    event: DragEvent<HTMLDivElement>,
    list: "visible" | "hidden",
    index: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDropTarget({ list, index });
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    // Only clear if we're leaving the container entirely
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback((
    event: DragEvent<HTMLDivElement>,
    to: "visible" | "hidden",
    targetIndex?: number
  ) => {
    event.preventDefault();
    setDraggingPanel(null);
    setDropTarget(null);
    
    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return;
    let parsed: { panel?: DashboardPanelKey; from?: "visible" | "hidden" };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const panel = parsed.panel;
    const from = parsed.from;
    if (!panel || (from !== "visible" && from !== "hidden")) return;

    const sourcePanels = from === "visible" ? visiblePanels : hiddenPanels;
    const sourceIndex = sourcePanels.indexOf(panel);
    const isSameList = from === to;

    const nextVisible = visiblePanels.filter((item) => item !== panel);
    const nextHidden = hiddenPanels.filter((item) => item !== panel);

    if (to === "visible") {
      let insertIdx = targetIndex ?? nextVisible.length;
      if (isSameList && sourceIndex !== -1 && targetIndex !== undefined && sourceIndex < targetIndex) {
        insertIdx -= 1;
      }
      if (insertIdx < 0) insertIdx = 0;
      if (insertIdx > nextVisible.length) insertIdx = nextVisible.length;
      const updated = [...nextVisible];
      updated.splice(insertIdx, 0, panel);
      setPanelLists(updated, nextHidden);
      return;
    }

    let insertIdx = targetIndex ?? nextHidden.length;
    if (isSameList && sourceIndex !== -1 && targetIndex !== undefined && sourceIndex < targetIndex) {
      insertIdx -= 1;
    }
    if (insertIdx < 0) insertIdx = 0;
    if (insertIdx > nextHidden.length) insertIdx = nextHidden.length;
    const updated = [...nextHidden];
    updated.splice(insertIdx, 0, panel);
    setPanelLists(nextVisible, updated);
  }, [hiddenPanels, setPanelLists, visiblePanels]);

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

  const entriesByChallenge = useMemo(() => {
    const map = new Map<string, typeof entries>();
    entries.forEach((entry) => {
      const list = map.get(entry.challengeId) ?? [];
      list.push(entry);
      map.set(entry.challengeId, list);
    });
    return map;
  }, [entries]);

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
                  <div 
                    className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-lg z-50 p-4 space-y-4"
                    onDragLeave={handleDragLeave}
                  >
                    {/* Visible Panels Section */}
                    <div>
                      <p className="px-1 pb-2 text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Visible
                      </p>
                      <div
                        className={`rounded-lg border-2 transition-colors ${
                          draggingPanel && dropTarget?.list === "visible" && dropTarget?.index === visiblePanels.length
                            ? "border-accent bg-accent/5"
                            : draggingPanel
                            ? "border-dashed border-border"
                            : "border-border/60"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "visible", visiblePanels.length)}
                        onDrop={(e) => handleDrop(e, "visible", visiblePanels.length)}
                      >
                        {visiblePanels.map((panel, index) => (
                          <div key={panel}>
                            {/* Drop indicator line */}
                            <div
                              className={`h-0.5 mx-2 rounded-full transition-all ${
                                dropTarget?.list === "visible" && dropTarget?.index === index
                                  ? "bg-accent my-1"
                                  : "bg-transparent"
                              }`}
                              onDragOver={(e) => handleDragOver(e, "visible", index)}
                              onDrop={(e) => handleDrop(e, "visible", index)}
                            />
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, panel, "visible")}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOver(e, "visible", index)}
                              onDrop={(e) => handleDrop(e, "visible", index)}
                              className={`flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none transition-all ${
                                draggingPanel === panel
                                  ? "opacity-50 bg-border/30"
                                  : "hover:bg-border/50"
                              }`}
                            >
                              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                              </svg>
                              <span className="text-sm text-ink flex-1">{PANEL_LABELS[panel]}</span>
                            </div>
                          </div>
                        ))}
                        {visiblePanels.length === 0 && (
                          <p className="px-3 py-3 text-xs text-muted text-center">Drop panels here</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Hidden Panels Section */}
                    <div>
                      <p className="px-1 pb-2 text-xs font-medium text-muted uppercase tracking-wide flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                        Hidden
                      </p>
                      <div
                        className={`rounded-lg border-2 transition-colors min-h-[44px] ${
                          draggingPanel && dropTarget?.list === "hidden" && dropTarget?.index === hiddenPanels.length
                            ? "border-accent bg-accent/5"
                            : draggingPanel
                            ? "border-dashed border-border"
                            : "border-border/60"
                        }`}
                        onDragOver={(e) => handleDragOver(e, "hidden", hiddenPanels.length)}
                        onDrop={(e) => handleDrop(e, "hidden", hiddenPanels.length)}
                      >
                        {hiddenPanels.length === 0 ? (
                          <p className="px-3 py-3 text-xs text-muted text-center">
                            {draggingPanel ? "Drop here to hide" : "All panels visible"}
                          </p>
                        ) : (
                          hiddenPanels.map((panel, index) => (
                            <div key={panel}>
                              {/* Drop indicator line */}
                              <div
                                className={`h-0.5 mx-2 rounded-full transition-all ${
                                  dropTarget?.list === "hidden" && dropTarget?.index === index
                                    ? "bg-accent my-1"
                                    : "bg-transparent"
                                }`}
                                onDragOver={(e) => handleDragOver(e, "hidden", index)}
                                onDrop={(e) => handleDrop(e, "hidden", index)}
                              />
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, panel, "hidden")}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, "hidden", index)}
                                onDrop={(e) => handleDrop(e, "hidden", index)}
                                className={`flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none transition-all ${
                                  draggingPanel === panel
                                    ? "opacity-50 bg-border/30"
                                    : "hover:bg-border/50"
                                }`}
                              >
                                <svg className="w-4 h-4 text-muted flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                                </svg>
                                <span className="text-sm text-ink/70 flex-1">{PANEL_LABELS[panel]}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Challenges list - shown first when empty for better UX */}
      {challenges.length === 0 && (
        <ChallengeList
          challenges={challenges}
          loading={challengesLoading}
          error={error}
          onCreateChallenge={createChallenge}
          onRefresh={handleRefresh}
        />
      )}

      {/* Dashboard highlights - only show when user has data and panel enabled */}
      {challenges.length > 0 && (
        <>
          {visiblePanels.map((panel) => {
            switch (panel) {
              case "activeChallenges":
                return (
                  <ChallengeList
                    key={panel}
                    challenges={challenges}
                    loading={challengesLoading}
                    error={error}
                    onCreateChallenge={createChallenge}
                    onRefresh={handleRefresh}
                    entriesByChallenge={entriesByChallenge}
                  />
                );
              case "highlights":
                return (
                  <DashboardHighlights key={panel} stats={dashboardStats} loading={statsLoading} />
                );
              case "personalRecords":
                return (
                  <PersonalRecords 
                    key={panel}
                    records={personalRecords} 
                    loading={statsLoading} 
                    challengeNames={challengeNames}
                  />
                );
              case "progressGraph":
                return entries.length > 0 ? (
                  <ProgressGraph key={panel} entries={entries} challenges={challengesById} />
                ) : null;
              case "burnUpChart":
                return challenges.length > 0 ? (
                  <div key={panel} className="space-y-6">
                    <h2 className="text-lg font-semibold text-ink">Goal Progress</h2>
                    {challenges.slice(0, 3).map(({ challenge }) => (
                      <BurnUpChart 
                        key={challenge.id}
                        entries={entriesByChallenge.get(challenge.id) ?? []} 
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
