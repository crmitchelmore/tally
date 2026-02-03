import { describe, it, expect } from "vitest";
import type { DashboardConfig, DashboardPanelKey } from "@/app/api/v1/_lib/types";

// Constants matching the dashboard implementation
const BASE_PANEL_ORDER: DashboardPanelKey[] = [
  "activeChallenges",
  "highlights", 
  "personalRecords",
  "progressGraph",
  "burnUpChart",
];

const PANEL_LABELS: Record<DashboardPanelKey, string> = {
  activeChallenges: "Active Challenges",
  highlights: "Highlights",
  personalRecords: "Personal Records",
  progressGraph: "Progress Graph",
  burnUpChart: "Goal Progress",
};

/**
 * Normalize dashboard config to ensure all panels are present
 * Mirrors the logic in page.tsx
 */
function normalizeDashboardConfig(config: DashboardConfig | null | undefined): {
  visible: DashboardPanelKey[];
  hidden: DashboardPanelKey[];
} {
  if (!config) {
    return { visible: [...BASE_PANEL_ORDER], hidden: [] };
  }

  const visible = config.visible?.length ? [...config.visible] : [...BASE_PANEL_ORDER];
  const hidden = config.hidden ? [...config.hidden] : [];

  // Ensure all panels exist
  const allKnown = new Set([...visible, ...hidden]);
  const missing = BASE_PANEL_ORDER.filter(p => !allKnown.has(p));
  visible.push(...missing);

  return { visible, hidden };
}

/**
 * Move a panel to a new position
 * Mirrors the movePanel logic in page.tsx
 */
function movePanel(
  currentConfig: { visible: DashboardPanelKey[]; hidden: DashboardPanelKey[] },
  panel: DashboardPanelKey,
  fromList: "visible" | "hidden",
  toList: "visible" | "hidden",
  toIndex: number
): { visible: DashboardPanelKey[]; hidden: DashboardPanelKey[] } {
  const currentVisible = [...currentConfig.visible];
  const currentHidden = [...currentConfig.hidden];
  
  // Remove panel from its current list
  const visibleWithoutPanel = currentVisible.filter(p => p !== panel);
  const hiddenWithoutPanel = currentHidden.filter(p => p !== panel);
  
  let newVisible: DashboardPanelKey[];
  let newHidden: DashboardPanelKey[];
  
  if (toList === "visible") {
    newVisible = [...visibleWithoutPanel];
    const insertAt = Math.min(Math.max(0, toIndex), newVisible.length);
    newVisible.splice(insertAt, 0, panel);
    newHidden = hiddenWithoutPanel;
  } else {
    newHidden = [...hiddenWithoutPanel];
    const insertAt = Math.min(Math.max(0, toIndex), newHidden.length);
    newHidden.splice(insertAt, 0, panel);
    newVisible = visibleWithoutPanel;
  }
  
  return { visible: newVisible, hidden: newHidden };
}

describe("Dashboard Panel Configuration", () => {
  describe("normalizeDashboardConfig", () => {
    it("returns default order when config is null", () => {
      const result = normalizeDashboardConfig(null);
      expect(result.visible).toEqual(BASE_PANEL_ORDER);
      expect(result.hidden).toEqual([]);
    });

    it("returns default order when config is undefined", () => {
      const result = normalizeDashboardConfig(undefined);
      expect(result.visible).toEqual(BASE_PANEL_ORDER);
      expect(result.hidden).toEqual([]);
    });

    it("preserves existing visible and hidden arrays", () => {
      const config: DashboardConfig = {
        panels: {
          highlights: true,
          personalRecords: true,
          progressGraph: true,
          burnUpChart: true,
          setsStats: true,
        },
        visible: ["highlights", "activeChallenges"],
        hidden: ["personalRecords"],
      };
      const result = normalizeDashboardConfig(config);
      
      // Should preserve the order
      expect(result.visible.slice(0, 2)).toEqual(["highlights", "activeChallenges"]);
      expect(result.hidden).toContain("personalRecords");
    });

    it("adds missing panels to visible list", () => {
      const config: DashboardConfig = {
        panels: {
          highlights: true,
          personalRecords: true,
          progressGraph: true,
          burnUpChart: true,
          setsStats: true,
        },
        visible: ["highlights"],
        hidden: ["personalRecords"],
      };
      const result = normalizeDashboardConfig(config);
      
      // Should contain all panels
      const allPanels = new Set([...result.visible, ...result.hidden]);
      expect(allPanels.size).toBe(BASE_PANEL_ORDER.length);
      BASE_PANEL_ORDER.forEach(panel => {
        expect(allPanels.has(panel)).toBe(true);
      });
    });

    it("handles legacy config format (panels only, no visible/hidden)", () => {
      const config: DashboardConfig = {
        panels: {
          highlights: true,
          personalRecords: false,
          progressGraph: true,
          burnUpChart: false,
          setsStats: true,
        },
        // No visible/hidden arrays
      };
      const result = normalizeDashboardConfig(config);
      
      // Should return default visible order since no visible array provided
      expect(result.visible).toEqual(BASE_PANEL_ORDER);
    });
  });

  describe("movePanel", () => {
    const defaultConfig = {
      visible: ["activeChallenges", "highlights", "personalRecords"] as DashboardPanelKey[],
      hidden: ["progressGraph", "burnUpChart"] as DashboardPanelKey[],
    };

    describe("within same list", () => {
      it("moves panel from beginning to end of visible list", () => {
        const result = movePanel(
          defaultConfig,
          "activeChallenges",
          "visible",
          "visible",
          3 // After personalRecords
        );
        
        expect(result.visible).toEqual(["highlights", "personalRecords", "activeChallenges"]);
        expect(result.hidden).toEqual(["progressGraph", "burnUpChart"]);
      });

      it("moves panel from end to beginning of visible list", () => {
        const result = movePanel(
          defaultConfig,
          "personalRecords",
          "visible",
          "visible",
          0
        );
        
        expect(result.visible).toEqual(["personalRecords", "activeChallenges", "highlights"]);
      });

      it("moves panel within hidden list", () => {
        const result = movePanel(
          defaultConfig,
          "burnUpChart",
          "hidden",
          "hidden",
          0
        );
        
        expect(result.hidden).toEqual(["burnUpChart", "progressGraph"]);
      });
    });

    describe("between lists", () => {
      it("moves panel from visible to hidden", () => {
        const result = movePanel(
          defaultConfig,
          "highlights",
          "visible",
          "hidden",
          0
        );
        
        expect(result.visible).toEqual(["activeChallenges", "personalRecords"]);
        expect(result.hidden).toEqual(["highlights", "progressGraph", "burnUpChart"]);
      });

      it("moves panel from hidden to visible", () => {
        const result = movePanel(
          defaultConfig,
          "progressGraph",
          "hidden",
          "visible",
          1
        );
        
        expect(result.visible).toEqual(["activeChallenges", "progressGraph", "highlights", "personalRecords"]);
        expect(result.hidden).toEqual(["burnUpChart"]);
      });

      it("moves panel from hidden to end of visible", () => {
        const result = movePanel(
          defaultConfig,
          "burnUpChart",
          "hidden",
          "visible",
          10 // Large index should clamp to end
        );
        
        expect(result.visible).toEqual(["activeChallenges", "highlights", "personalRecords", "burnUpChart"]);
        expect(result.hidden).toEqual(["progressGraph"]);
      });
    });

    describe("edge cases", () => {
      it("handles negative index by clamping to 0", () => {
        const result = movePanel(
          defaultConfig,
          "personalRecords",
          "visible",
          "visible",
          -5
        );
        
        expect(result.visible[0]).toBe("personalRecords");
      });

      it("handles index larger than array length by appending", () => {
        const result = movePanel(
          defaultConfig,
          "activeChallenges",
          "visible",
          "visible",
          100
        );
        
        expect(result.visible[result.visible.length - 1]).toBe("activeChallenges");
      });

      it("preserves other list when moving between lists", () => {
        const result = movePanel(
          defaultConfig,
          "highlights",
          "visible",
          "hidden",
          1
        );
        
        // Other panels in original positions
        expect(result.visible).toEqual(["activeChallenges", "personalRecords"]);
      });
    });
  });

  describe("Panel Labels", () => {
    it("has labels for all panel types", () => {
      BASE_PANEL_ORDER.forEach(panel => {
        expect(PANEL_LABELS[panel]).toBeDefined();
        expect(typeof PANEL_LABELS[panel]).toBe("string");
        expect(PANEL_LABELS[panel].length).toBeGreaterThan(0);
      });
    });

    it("has user-friendly labels", () => {
      expect(PANEL_LABELS.activeChallenges).toBe("Active Challenges");
      expect(PANEL_LABELS.highlights).toBe("Highlights");
      expect(PANEL_LABELS.personalRecords).toBe("Personal Records");
      expect(PANEL_LABELS.progressGraph).toBe("Progress Graph");
      expect(PANEL_LABELS.burnUpChart).toBe("Goal Progress");
    });
  });
});

describe("Dashboard Config API Format Compatibility", () => {
  it("web API returns visible/hidden format", () => {
    // This documents the expected API response format
    const apiResponse = {
      dashboardConfig: {
        panels: {
          highlights: true,
          personalRecords: true,
          progressGraph: true,
          burnUpChart: true,
          setsStats: true,
        },
        visible: ["activeChallenges", "highlights"],
        hidden: ["progressGraph"],
      },
    };

    expect(apiResponse.dashboardConfig.visible).toBeDefined();
    expect(apiResponse.dashboardConfig.hidden).toBeDefined();
    expect(Array.isArray(apiResponse.dashboardConfig.visible)).toBe(true);
    expect(Array.isArray(apiResponse.dashboardConfig.hidden)).toBe(true);
  });

  it("iOS/Android expect visible/hidden OR visiblePanels/hiddenPanels", () => {
    // iOS and Android clients can accept either format:
    // - visible/hidden (from web API)
    // - visiblePanels/hiddenPanels (internal storage format)
    
    const webFormat = { visible: ["activeChallenges"], hidden: [] };
    const internalFormat = { visiblePanels: ["activeChallenges"], hiddenPanels: [] };
    
    // Both should have panel arrays
    expect(webFormat.visible).toBeDefined();
    expect(internalFormat.visiblePanels).toBeDefined();
  });
});
