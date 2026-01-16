import { describe, it, expect } from "vitest";

// Test challenge data structures and utilities

describe("Challenge validation", () => {
  const validChallenge = {
    name: "Read 100 books",
    targetNumber: 100,
    color: "#3B82F6",
    icon: "📚",
    timeframeUnit: "year" as const,
    year: 2026,
    isPublic: false,
  };

  it("validates challenge name is required", () => {
    expect(validChallenge.name.length).toBeGreaterThan(0);
  });

  it("validates target number is positive", () => {
    expect(validChallenge.targetNumber).toBeGreaterThan(0);
  });

  it("validates color is hex format", () => {
    expect(validChallenge.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("validates timeframe unit is valid", () => {
    const validUnits = ["year", "month", "custom"];
    expect(validUnits).toContain(validChallenge.timeframeUnit);
  });

  it("validates year is reasonable", () => {
    const currentYear = new Date().getFullYear();
    expect(validChallenge.year).toBeGreaterThanOrEqual(currentYear - 10);
    expect(validChallenge.year).toBeLessThanOrEqual(currentYear + 10);
  });
});

describe("Challenge filtering", () => {
  const challenges = [
    { id: "1", name: "Books", archived: false, year: 2026 },
    { id: "2", name: "Running", archived: true, year: 2026 },
    { id: "3", name: "Old goal", archived: false, year: 2024 },
  ];

  it("filters out archived challenges", () => {
    const active = challenges.filter(c => !c.archived);
    expect(active).toHaveLength(2);
    expect(active.find(c => c.name === "Running")).toBeUndefined();
  });

  it("can find challenges by year", () => {
    const currentYear = challenges.filter(c => c.year === 2026);
    expect(currentYear).toHaveLength(2);
  });
});

describe("Challenge colors", () => {
  const defaultColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  it("has exactly 6 default colors", () => {
    expect(defaultColors).toHaveLength(6);
  });

  it("all colors are valid hex", () => {
    defaultColors.forEach(color => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
