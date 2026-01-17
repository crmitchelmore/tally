"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataPortability from "../data-portability/data-portability";

const accent = "#b21f24";
const ink = "#1a1a1a";
const surface = "#fdfcf9";
const surfaceEdge = "#e4e1da";
const muted = "#6b6b6b";

const FEELINGS = [
  { value: "very-easy", label: "Very easy" },
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
  { value: "very-hard", label: "Very hard" },
] as const;

type Feeling = (typeof FEELINGS)[number]["value"];

type Challenge = {
  id: string;
  name: string;
  targetNumber: number;
  color: string;
  icon: string;
  timeframeUnit: "year" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  year: number;
  isPublic: boolean;
  archived: boolean;
};

type Entry = {
  id: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  feeling?: Feeling;
  sets?: { reps: number }[];
  createdAt: string;
};

type EntryDraft = {
  id?: string;
  challengeId: string;
  date: string;
  count: number;
  note: string;
  feeling?: Feeling;
  sets: { reps: number }[];
};

type PublicChallenge = Challenge & {
  totalReps: number;
  progress: number;
  followerCount: number;
  ownerName: string;
  ownerAvatarUrl: string | null;
};

type Followed = {
  id: string;
  challengeId: string;
  followedAt: string;
};

type FollowQueueItem = {
  id: string;
  action: "follow" | "unfollow";
  challengeId: string;
  followedId?: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const dayMs = 24 * 60 * 60 * 1000;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

function isFutureDate(date: string) {
  return date > todayIso();
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / dayMs);
}

function startOfWeek(date: Date) {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function getChallengeWindow(challenge: Challenge) {
  if (challenge.startDate && challenge.endDate) {
    return {
      start: parseIsoDate(challenge.startDate),
      end: parseIsoDate(challenge.endDate),
    };
  }
  if (challenge.timeframeUnit === "year") {
    return {
      start: new Date(Date.UTC(challenge.year, 0, 1)),
      end: new Date(Date.UTC(challenge.year, 11, 31)),
    };
  }
  if (challenge.timeframeUnit === "month") {
    const base = challenge.startDate
      ? parseIsoDate(challenge.startDate)
      : challenge.endDate
        ? parseIsoDate(challenge.endDate)
        : new Date(Date.UTC(challenge.year, new Date().getUTCMonth(), 1));
    return { start: startOfMonth(base), end: endOfMonth(base) };
  }
  const fallback = challenge.startDate ? parseIsoDate(challenge.startDate) : new Date();
  const fallbackEnd = challenge.endDate ? parseIsoDate(challenge.endDate) : fallback;
  return { start: fallback, end: fallbackEnd };
}

function buildDailyTotals(entries: Entry[]) {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.count);
  });
  return totals;
}

function computeStreaks(dailyTotals: Map<string, number>, endDate: string) {
  const dates = Array.from(dailyTotals.keys()).sort();
  if (!dates.length) return { current: 0, longest: 0, daysActive: 0 };
  const activeDates = new Set(dates);
  let current = 0;
  let cursor = parseIsoDate(endDate);
  while (activeDates.has(toIsoDate(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i += 1) {
    const iso = dates[i];
    if (i === 0) {
      run = 1;
    } else {
      const prev = parseIsoDate(dates[i - 1]);
      const next = parseIsoDate(iso);
      run = daysBetween(prev, next) === 1 ? run + 1 : 1;
    }
    if (run > longest) longest = run;
  }
  return { current, longest, daysActive: dates.length };
}

function PublicChallengeCard({
  challenge,
  isOwner,
  isFollowing,
  isPending,
  disabled,
  onToggle,
}: {
  challenge: PublicChallenge;
  isOwner: boolean;
  isFollowing: boolean;
  isPending: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const progress = Math.min(Math.max(challenge.progress, 0), 1);
  const progressLabel =
    challenge.targetNumber > 0
      ? `${Math.round(progress * 100)}% of ${challenge.targetNumber}`
      : `${challenge.totalReps} marks`;
  return (
    <div
      style={{
        borderRadius: "18px",
        border: `1px solid ${surfaceEdge}`,
        background: "#ffffff",
        padding: "16px",
        display: "grid",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "grid", gap: "6px" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "16px" }}>{challenge.name}</p>
          <p style={{ margin: 0, fontSize: "13px", color: muted }}>
            {challenge.ownerName} · {challenge.totalReps} marks
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {challenge.ownerAvatarUrl ? (
            <img
              src={challenge.ownerAvatarUrl}
              alt={`${challenge.ownerName} avatar`}
              style={{ width: "32px", height: "32px", borderRadius: "50%" }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#f0ede6",
                border: `1px solid ${surfaceEdge}`,
              }}
            />
          )}
        </div>
      </div>
      <div
        aria-label={`Progress ${progressLabel}`}
        style={{
          height: "10px",
          borderRadius: "999px",
          background: "rgba(26, 26, 26, 0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: challenge.color || accent,
            transition: "width 200ms ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <p style={{ margin: 0, fontSize: "12px", color: muted }}>{progressLabel}</p>
        <p style={{ margin: 0, fontSize: "12px", color: muted }}>
          {challenge.followerCount} following
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled || isOwner}
        style={{
          height: "36px",
          borderRadius: "999px",
          border: `1px solid ${isFollowing ? accent : surfaceEdge}`,
          background: isFollowing ? "#fff5f5" : "#ffffff",
          color: isFollowing ? accent : ink,
          fontWeight: 600,
          cursor: disabled || isOwner ? "not-allowed" : "pointer",
          opacity: disabled || isOwner ? 0.6 : 1,
        }}
      >
        {isOwner ? "Your challenge" : isPending ? "Updating..." : isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        borderRadius: "16px",
        border: `1px solid ${surfaceEdge}`,
        padding: "12px 14px",
        background: "#ffffff",
        minWidth: "160px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: muted,
        }}
      >
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{value}</p>
      {detail ? <p style={{ margin: 0, fontSize: "12px", color: muted }}>{detail}</p> : null}
    </div>
  );
}

function PaceCallout({
  status,
  message,
}: {
  status: "ahead" | "on-pace" | "behind";
  message: string;
}) {
  const tone =
    status === "ahead" ? "#e4f5ee" : status === "behind" ? "#fff5f5" : "#efebe4";
  const color = status === "ahead" ? "#0f6b42" : status === "behind" ? accent : muted;
  return (
    <div
      style={{
        borderRadius: "16px",
        border: `1px solid ${surfaceEdge}`,
        padding: "12px 14px",
        background: tone,
        color,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}

function CumulativeChart({
  points,
  targetPoints,
}: {
  points: { x: number; y: number }[];
  targetPoints: { x: number; y: number }[];
}) {
  if (!points.length || !targetPoints.length) return null;
  const width = 320;
  const height = 120;
  const maxY = Math.max(points[points.length - 1].y, targetPoints[targetPoints.length - 1].y, 1);
  const mapPoint = (point: { x: number; y: number }) => ({
    x: (point.x / (points.length - 1 || 1)) * (width - 20) + 10,
    y: height - 10 - (point.y / maxY) * (height - 20),
  });
  const line = points.map(mapPoint).map((p) => `${p.x},${p.y}`).join(" ");
  const targetLine = targetPoints.map(mapPoint).map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={width} height={height} role="img" aria-label="Cumulative progress chart">
      <polyline
        points={targetLine}
        fill="none"
        stroke={surfaceEdge}
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <polyline points={line} fill="none" stroke={accent} strokeWidth={3} />
    </svg>
  );
}

function WeeklyAverageChart({ weeks }: { weeks: { label: string; avg: number }[] }) {
  if (!weeks.length) return null;
  const max = Math.max(...weeks.map((week) => week.avg), 1);
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
      {weeks.map((week) => (
        <div key={week.label} style={{ textAlign: "center" }}>
          <div
            style={{
              width: "24px",
              height: `${Math.max(12, (week.avg / max) * 72)}px`,
              borderRadius: "8px",
              background: "#fff5f5",
              border: `1px solid ${surfaceEdge}`,
            }}
            aria-label={`${week.label} average ${week.avg.toFixed(1)}`}
          />
          <span style={{ fontSize: "11px", color: muted }}>{week.label}</span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({
  year,
  dailyTotals,
  onSelect,
  selectedDate,
}: {
  year: number;
  dailyTotals: Map<string, number>;
  onSelect: (date: string) => void;
  selectedDate: string;
}) {
  const months = Array.from({ length: 12 }).map((_, monthIndex) => {
    const base = new Date(Date.UTC(year, monthIndex, 1));
    const start = startOfMonth(base);
    const end = endOfMonth(base);
    const days = daysBetween(start, end) + 1;
    const leading = (start.getUTCDay() + 6) % 7;
    const cells = Array.from({ length: leading + days }).map((_, index) => {
      if (index < leading) return null;
      const date = addDays(start, index - leading);
      const iso = toIsoDate(date);
      return {
        iso,
        count: dailyTotals.get(iso) ?? 0,
      };
    });
    return { label: base.toLocaleDateString(undefined, { month: "short" }), cells };
  });
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {months.map((month) => (
        <div key={month.label} style={{ display: "grid", gap: "8px" }}>
          <p style={{ margin: 0, fontSize: "12px", color: muted }}>{month.label}</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "6px",
            }}
          >
            {month.cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => onSelect(cell.iso)}
                  style={{
                    height: "28px",
                    borderRadius: "8px",
                    border:
                      cell.iso === selectedDate
                        ? `2px solid ${accent}`
                        : `1px solid ${surfaceEdge}`,
                    background:
                      cell.count > 0 ? "#fff5f5" : "rgba(26, 26, 26, 0.04)",
                    color: cell.count > 0 ? ink : muted,
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  aria-label={`${cell.iso} ${cell.count} marks`}
                >
                  {cell.count || ""}
                </button>
              ) : (
                <div key={`empty-${index}`} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklySummaryDialog({
  open,
  onClose,
  weekOffset,
  onChangeWeek,
  entries,
  challenges,
}: {
  open: boolean;
  onClose: () => void;
  weekOffset: number;
  onChangeWeek: (next: number) => void;
  entries: Entry[];
  challenges: Challenge[];
}) {
  if (!open) return null;
  const base = addDays(startOfWeek(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }).map((_, index) => addDays(base, index));
  const dayTotals = days.map((day) => {
    const iso = toIsoDate(day);
    const total = entries
      .filter((entry) => entry.date === iso)
      .reduce((sum, entry) => sum + entry.count, 0);
    return { iso, label: day.toLocaleDateString(undefined, { weekday: "short" }), total };
  });
  const totalMarks = dayTotals.reduce((sum, day) => sum + day.total, 0);
  const entriesLogged = entries.filter(
    (entry) => entry.date >= toIsoDate(days[0]) && entry.date <= toIsoDate(days[6])
  );
  const activeChallengeIds = new Set(entriesLogged.map((entry) => entry.challengeId));
  const bestDay = dayTotals.reduce(
    (best, day) => (day.total > best.total ? day : best),
    dayTotals[0]
  );
  const challengeTotals = challenges
    .map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      total: entriesLogged
        .filter((entry) => entry.challengeId === challenge.id)
        .reduce((sum, entry) => sum + entry.count, 0),
    }))
    .filter((row) => row.total > 0);
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16, 16, 16, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          borderRadius: "24px",
          background: "#ffffff",
          padding: "20px",
          border: `1px solid ${surfaceEdge}`,
          display: "grid",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Weekly summary
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              {toIsoDate(days[0])} — {toIsoDate(days[6])}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatusCard label="Total marks" value={`${totalMarks}`} detail="This week" />
          <StatusCard
            label="Daily average"
            value={(totalMarks / 7).toFixed(1)}
            detail="Marks/day"
          />
          <StatusCard label="Entries logged" value={`${entriesLogged.length}`} />
          <StatusCard label="Active challenges" value={`${activeChallengeIds.size}`} />
          <StatusCard label="Best day" value={`${bestDay.label} (${bestDay.total})`} />
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
          {dayTotals.map((day) => (
            <div key={day.iso} style={{ textAlign: "center" }}>
              <div
                style={{
                  height: `${Math.max(8, (day.total / Math.max(totalMarks, 1)) * 60)}px`,
                  width: "28px",
                  borderRadius: "8px",
                  background: "#fff5f5",
                  border: `1px solid ${surfaceEdge}`,
                  margin: "0 auto 6px",
                }}
              />
              <span style={{ fontSize: "11px", color: muted }}>{day.label}</span>
            </div>
          ))}
        </div>
        {challengeTotals.length ? (
          <div style={{ display: "grid", gap: "6px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: muted }}>Challenge breakdown</p>
            {challengeTotals.map((row) => (
              <p key={row.id} style={{ margin: 0, fontSize: "14px" }}>
                {row.name}: <strong>{row.total}</strong>
              </p>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: muted }}>
            No entries logged for this week yet.
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => onChangeWeek(weekOffset - 1)}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onChangeWeek(Math.min(0, weekOffset + 1))}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            disabled={weekOffset >= 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function TallyMarks({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const groups = Math.ceil(Math.max(count, 1) / 5);
  const totalWidth = groups * 68;
  const height = 56;

  return (
    <svg
      width={totalWidth}
      height={height}
      viewBox={`0 0 ${totalWidth} ${height}`}
      role="img"
      aria-label={`Tally marks showing ${count} entries`}
    >
      <defs>
        <filter id="ink">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            seed="4"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.6" />
        </filter>
      </defs>
      {Array.from({ length: count }).map((_, index) => {
        const groupIndex = Math.floor(index / 5);
        const offset = groupIndex * 68;
        const local = index % 5;
        const isSlash = local === 4;
        const strokeColor = isSlash ? accent : ink;
        const baseDelay = reducedMotion ? "0ms" : `${index * 50}ms`;

        if (isSlash) {
          return (
            <line
              key={`slash-${index}`}
              x1={offset + 8}
              y1={8}
              x2={offset + 60}
              y2={48}
              stroke={strokeColor}
              strokeWidth={4.5}
              strokeLinecap="round"
              filter="url(#ink)"
              style={{
                opacity: reducedMotion ? 1 : 0,
                animation: reducedMotion
                  ? "none"
                  : `tally-draw 220ms ease-out ${baseDelay} forwards`,
              }}
            />
          );
        }

        return (
          <line
            key={`line-${index}`}
            x1={offset + 8 + local * 10}
            y1={6}
            x2={offset + 8 + local * 10}
            y2={50}
            stroke={strokeColor}
            strokeWidth={4.5}
            strokeLinecap="round"
            filter="url(#ink)"
            style={{
              opacity: reducedMotion ? 1 : 0,
              animation: reducedMotion
                ? "none"
                : `tally-draw 200ms ease-out ${baseDelay} forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes tally-draw {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}

function StatusPill({ label, tone }: { label: string; tone?: "good" | "muted" }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        backgroundColor: tone === "good" ? "#e4f5ee" : "#efebe4",
        color: tone === "good" ? "#0f6b42" : muted,
      }}
    >
      {label}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        borderRadius: "20px",
        border: `1px dashed ${surfaceEdge}`,
        padding: "24px",
        textAlign: "center",
        color: muted,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px" }}>
        No entries yet. Start with a single ink mark.
      </p>
      <button
        type="button"
        onClick={onAdd}
        style={{
          alignSelf: "center",
          height: "40px",
          padding: "0 20px",
          borderRadius: "999px",
          border: `1px solid ${ink}`,
          background: "#ffffff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Log your first entry
      </button>
    </div>
  );
}

function DayStrip({
  entries,
  reducedMotion,
}: {
  entries: Entry[];
  reducedMotion: boolean;
}) {
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const displayCount = Math.min(total, 12);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        padding: "16px",
        borderRadius: "18px",
        border: `1px solid ${surfaceEdge}`,
        backgroundColor: surface,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: muted,
          }}
        >
          Today
        </p>
        <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 600 }}>
          {total} marks
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <TallyMarks count={displayCount} reducedMotion={reducedMotion} />
        {total > displayCount ? (
          <span style={{ fontSize: "12px", color: muted }}>{total} total</span>
        ) : null}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const descriptor = entry.note
    ? entry.note
    : entry.feeling
      ? FEELINGS.find((item) => item.value === entry.feeling)?.label
      : entry.sets?.length
        ? `${entry.sets.length} sets`
        : "";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        padding: "12px 0",
        borderBottom: `1px solid ${surfaceEdge}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>
          {entry.count} marks
        </p>
        {descriptor ? (
          <p style={{ margin: 0, fontSize: "12px", color: muted }}>
            {descriptor}
          </p>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onEdit(entry)}
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            border: `1px solid ${ink}`,
            background: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "999px",
            border: `1px solid ${surfaceEdge}`,
            background: "#fff5f5",
            color: accent,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function EntryForm({
  draft,
  onChange,
  onCancel,
  onSave,
  challengeOptions,
}: {
  draft: EntryDraft;
  onChange: (next: EntryDraft) => void;
  onCancel: () => void;
  onSave: () => void;
  challengeOptions: Challenge[];
}) {
  const addSet = () => {
    onChange({ ...draft, sets: [...draft.sets, { reps: 8 }] });
  };

  const updateSet = (index: number, value: number) => {
    const nextSets = draft.sets.map((set, setIndex) =>
      setIndex === index ? { reps: value } : set
    );
    onChange({ ...draft, sets: nextSets });
  };

  const removeSet = (index: number) => {
    const nextSets = draft.sets.filter((_, setIndex) => setIndex !== index);
    onChange({ ...draft, sets: nextSets });
  };

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        border: `1px solid ${surfaceEdge}`,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "grid", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Challenge
        </label>
        <select
          value={draft.challengeId}
          onChange={(event) =>
            onChange({ ...draft, challengeId: event.target.value })
          }
          style={{
            height: "40px",
            borderRadius: "12px",
            border: `1px solid ${surfaceEdge}`,
            padding: "0 12px",
            fontSize: "14px",
          }}
        >
          <option value="">Select a challenge</option>
          {challengeOptions.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Date
        </label>
        <input
          type="date"
          value={draft.date}
          onChange={(event) => onChange({ ...draft, date: event.target.value })}
          max={todayIso()}
          style={{
            height: "40px",
            borderRadius: "12px",
            border: `1px solid ${surfaceEdge}`,
            padding: "0 12px",
            fontSize: "14px",
          }}
        />
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Count
        </label>
        <input
          type="number"
          min={1}
          value={draft.count}
          onChange={(event) =>
            onChange({ ...draft, count: Number(event.target.value) })
          }
          style={{
            height: "40px",
            borderRadius: "12px",
            border: `1px solid ${surfaceEdge}`,
            padding: "0 12px",
            fontSize: "14px",
          }}
        />
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Note
        </label>
        <textarea
          rows={3}
          value={draft.note}
          onChange={(event) => onChange({ ...draft, note: event.target.value })}
          style={{
            borderRadius: "12px",
            border: `1px solid ${surfaceEdge}`,
            padding: "10px 12px",
            fontSize: "14px",
          }}
        />
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <label
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Feeling
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FEELINGS.map((feeling) => (
            <button
              key={feeling.value}
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  feeling: draft.feeling === feeling.value ? undefined : feeling.value,
                })
              }
              style={{
                height: "32px",
                padding: "0 12px",
                borderRadius: "999px",
                border: `1px solid ${draft.feeling === feeling.value ? accent : surfaceEdge}`,
                background: draft.feeling === feeling.value ? "#fff5f5" : "#ffffff",
                color: draft.feeling === feeling.value ? accent : ink,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {feeling.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Sets
          </label>
          <button
            type="button"
            onClick={addSet}
            style={{
              height: "28px",
              padding: "0 12px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add set
          </button>
        </div>
        {draft.sets.length ? (
          <div style={{ display: "grid", gap: "8px" }}>
            {draft.sets.map((set, index) => (
              <div
                key={`${set.reps}-${index}`}
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type="number"
                  min={1}
                  value={set.reps}
                  onChange={(event) => updateSet(index, Number(event.target.value))}
                  style={{
                    height: "36px",
                    borderRadius: "12px",
                    border: `1px solid ${surfaceEdge}`,
                    padding: "0 10px",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeSet(index)}
                  style={{
                    height: "32px",
                    padding: "0 10px",
                    borderRadius: "999px",
                    border: `1px solid ${surfaceEdge}`,
                    background: "#fff5f5",
                    color: accent,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "12px", color: muted }}>
            Optional. Add sets if you tracked reps.
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            height: "40px",
            padding: "0 20px",
            borderRadius: "999px",
            border: "none",
            background: accent,
            color: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Save entry
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: "40px",
            padding: "0 20px",
            borderRadius: "999px",
            border: `1px solid ${surfaceEdge}`,
            background: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Drilldown({
  entries,
  selectedDate,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  selectedDate: string;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const selectedEntries = entries.filter((entry) => entry.date === selectedDate);

  return (
    <div
      style={{
        borderRadius: "18px",
        border: `1px solid ${surfaceEdge}`,
        padding: "18px",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: muted,
            }}
          >
            {formatDisplayDate(selectedDate)}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
            {selectedEntries.length} entries
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: muted }}>Day detail</span>
        </div>
      </div>
      {selectedEntries.length ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {selectedEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "13px", color: muted }}>
          No entries logged for this day.
        </p>
      )}
    </div>
  );
}

function DayButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: "52px",
        borderRadius: "14px",
        border: active ? `2px solid ${accent}` : `1px solid ${surfaceEdge}`,
        background: active ? "#fff5f5" : "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "4px",
        cursor: "pointer",
        minWidth: "54px",
      }}
      aria-pressed={active}
    >
      <span style={{ fontSize: "12px", color: muted }}>{label}</span>
      <span style={{ fontSize: "16px", fontWeight: 600 }}>{count}</span>
    </button>
  );
}

function WeekOverview({
  entries,
  selectedDate,
  onSelect,
}: {
  entries: Entry[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const days = useMemo(() => {
    const base = new Date();
    const index = base.getDay();
    const monday = new Date(base);
    const diff = index === 0 ? -6 : 1 - index;
    monday.setDate(base.getDate() + diff);

    return Array.from({ length: 7 }).map((_, offset) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      const iso = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      const count = entries
        .filter((entry) => entry.date === iso)
        .reduce((sum, entry) => sum + entry.count, 0);
      return { iso, label, count };
    });
  }, [entries]);

  return (
    <div style={{ display: "flex", gap: "10px", overflowX: "auto" }}>
      {days.map((day) => (
        <DayButton
          key={day.iso}
          label={day.label}
          count={day.count}
          active={day.iso === selectedDate}
          onClick={() => onSelect(day.iso)}
        />
      ))}
    </div>
  );
}

export default function EntriesClient() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [publicChallenges, setPublicChallenges] = useState<PublicChallenge[]>([]);
  const [followed, setFollowed] = useState<Followed[]>([]);
  const [publicQuery, setPublicQuery] = useState("");
  const [followSyncing, setFollowSyncing] = useState<string | null>(null);
  const [followQueue, setFollowQueue] = useState<FollowQueueItem[]>([]);
  const [pendingFollows, setPendingFollows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<EntryDraft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<EntryDraft>(() => ({
    challengeId: "",
    date: todayIso(),
    count: 1,
    note: "",
    sets: [],
  }));
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [weeklySummaryOpen, setWeeklySummaryOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  const todayEntries = useMemo(() => {
    return entries.filter((entry) => entry.date === todayIso());
  }, [entries]);

  const totalMarks = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.count, 0);
  }, [entries]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [challengesResponse, entriesResponse, publicResponse, followedResponse] =
        await Promise.all([
        fetch("/api/v1/challenges", { cache: "no-store" }),
        fetch("/api/v1/entries", { cache: "no-store" }),
        fetch("/api/v1/public/challenges", { cache: "no-store" }),
        fetch("/api/v1/followed", { cache: "no-store" }),
      ]);
      if (
        !challengesResponse.ok ||
        !entriesResponse.ok ||
        !publicResponse.ok ||
        !followedResponse.ok
      ) {
        throw new Error("Unable to load entries.");
      }
      const [challengeData, entryData, publicData, followedData] = await Promise.all([
        challengesResponse.json(),
        entriesResponse.json(),
        publicResponse.json(),
        followedResponse.json(),
      ]);
      setChallenges(challengeData);
      setEntries(entryData);
      setPublicChallenges(publicData);
      setFollowed(followedData);
      setDraft((prev) => ({
        ...prev,
        challengeId: prev.challengeId || challengeData[0]?.id || "",
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncQueue = useCallback(async () => {
    if ((!offlineQueue.length && !followQueue.length) || offline || saving) return;
    setSaving(true);
    try {
      for (const queued of offlineQueue) {
        const response = await fetch("/api/v1/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: queued.challengeId,
            date: queued.date,
            count: queued.count,
            note: queued.note || undefined,
            feeling: queued.feeling,
            sets: queued.sets.length ? queued.sets : undefined,
          }),
        });
        if (!response.ok) {
          throw new Error("Unable to sync queued entry.");
        }
        const saved = (await response.json()) as Entry;
        setEntries((prev) => [...prev, saved]);
      }
      setOfflineQueue([]);
      for (const queued of followQueue) {
        if (queued.action === "follow") {
          const response = await fetch("/api/v1/followed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: queued.challengeId }),
          });
          if (!response.ok) {
            throw new Error("Unable to sync follow.");
          }
          const created = (await response.json()) as Followed;
          setFollowed((prev) => {
            const next = prev.filter(
              (record) =>
                record.challengeId !== queued.challengeId || !record.id.startsWith("local_follow_")
            );
            return next.some((record) => record.id === created.id) ? next : [...next, created];
          });
          setPendingFollows((prev) => {
            const next = new Set(prev);
            next.delete(queued.challengeId);
            return next;
          });
          continue;
        }
        if (!queued.followedId) {
          continue;
        }
        const response = await fetch(`/api/v1/followed/${queued.followedId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Unable to sync unfollow.");
        }
        setFollowed((prev) => prev.filter((record) => record.id !== queued.followedId));
        setPendingFollows((prev) => {
          const next = new Set(prev);
          next.delete(queued.challengeId);
          return next;
        });
      }
      setFollowQueue([]);
    } catch (syncError) {
      setError(
        syncError instanceof Error ? syncError.message : "Unable to sync offline activity."
      );
    } finally {
      setSaving(false);
    }
  }, [offlineQueue, followQueue, offline, saving]);

  const enqueueFollow = useCallback((item: FollowQueueItem) => {
    setFollowQueue((prev) => {
      const next = prev.filter((entry) => entry.challengeId !== item.challengeId);
      return [...next, item];
    });
  }, []);

  const handleToggleFollow = useCallback(
    async (challengeId: string) => {
      if (offline) {
        setError("You're offline. Follow when you're back online.");
        return;
      }
      setError(null);
      setFollowSyncing(challengeId);
      setPendingFollows((prev) => new Set(prev).add(challengeId));
      const existing = followed.find((record) => record.challengeId === challengeId);
      try {
        if (existing) {
          const response = await fetch(`/api/v1/followed/${existing.id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Unable to unfollow.");
          setFollowed((prev) => prev.filter((record) => record.id !== existing.id));
          setPublicChallenges((prev) =>
            prev.map((challenge) =>
              challenge.id === challengeId
                ? {
                    ...challenge,
                    followerCount: Math.max(0, challenge.followerCount - 1),
                  }
                : challenge
            )
          );
          setPendingFollows((prev) => {
            const next = new Set(prev);
            next.delete(challengeId);
            return next;
          });
          return;
        }
        const response = await fetch("/api/v1/followed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId }),
        });
        if (!response.ok) throw new Error("Unable to follow.");
        const created = (await response.json()) as Followed;
        setFollowed((prev) => [...prev, created]);
        setPublicChallenges((prev) =>
          prev.map((challenge) =>
            challenge.id === challengeId
              ? { ...challenge, followerCount: challenge.followerCount + 1 }
              : challenge
          )
        );
        setPendingFollows((prev) => {
          const next = new Set(prev);
          next.delete(challengeId);
          return next;
        });
      } catch (followError) {
        setError(followError instanceof Error ? followError.message : "Unable to update follow.");
        setPendingFollows((prev) => {
          const next = new Set(prev);
          next.delete(challengeId);
          return next;
        });
      } finally {
        setFollowSyncing(null);
      }
    },
    [followed, offline]
  );

  useEffect(() => {
    const handleOnline = () => {
      syncQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  const startNew = () => {
    setDraft({
      challengeId: challenges[0]?.id ?? "",
      date: todayIso(),
      count: 1,
      note: "",
      sets: [],
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!draft.challengeId) {
      setError("Pick a challenge before logging.");
      return;
    }
    if (draft.count <= 0) {
      setError("Count must be at least 1.");
      return;
    }
    if (!draft.date || isFutureDate(draft.date)) {
      setError("Choose today or a past date.");
      return;
    }

    setError(null);
    const payload = {
      challengeId: draft.challengeId,
      date: draft.date,
      count: draft.count,
      note: draft.note || undefined,
      feeling: draft.feeling,
      sets: draft.sets.length ? draft.sets : undefined,
    };

    if (offline) {
      setOfflineQueue((prev) => [...prev, draft]);
      setEntries((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          challengeId: draft.challengeId,
          date: draft.date,
          count: draft.count,
          note: draft.note || undefined,
          feeling: draft.feeling,
          sets: draft.sets.length ? draft.sets : undefined,
          createdAt: new Date().toISOString(),
        },
      ]);
      setShowForm(false);
      return;
    }

    setSaving(true);
    try {
      if (draft.id) {
        const response = await fetch(`/api/v1/entries/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Unable to update entry.");
        }
        const updated = (await response.json()) as Entry;
        setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      } else {
        const response = await fetch("/api/v1/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error("Unable to log entry.");
        }
        const saved = (await response.json()) as Entry;
        setEntries((prev) => [...prev, saved]);
      }
      setShowForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setDraft({
      id: entry.id,
      challengeId: entry.challengeId,
      date: entry.date,
      count: entry.count,
      note: entry.note ?? "",
      feeling: entry.feeling,
      sets: entry.sets ?? [],
    });
    setShowForm(true);
  };

  const handleDelete = async (entry: Entry) => {
    setError(null);
    if (offline) {
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/entries/${entry.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to delete entry.");
      }
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete entry.");
    } finally {
      setSaving(false);
    }
  };

  const syncLabel = offline
    ? "Offline: queueing"
    : saving
      ? "Syncing"
      : "All synced";

  const syncTone = offline ? "muted" : saving ? "muted" : "good";

  const entriesForDrilldown = draft.challengeId
    ? entries.filter((entry) => entry.challengeId === draft.challengeId)
    : entries;

  const followingCardIds = useMemo(() => {
    return new Set(followed.map((record) => record.challengeId));
  }, [followed]);

  const selectedChallenge = selectedChallengeId
    ? challenges.find((challenge) => challenge.id === selectedChallengeId) ?? null
    : null;

  const dailyTotals = useMemo(() => {
    const relevant = selectedChallenge
      ? entries.filter((entry) => entry.challengeId === selectedChallenge.id)
      : entries;
    return buildDailyTotals(relevant);
  }, [entries, selectedChallenge]);

  const publicFiltered = useMemo(() => {
    const query = publicQuery.trim().toLowerCase();
    const filtered = publicChallenges.filter((challenge) => {
      if (!query) return true;
      return (
        challenge.name.toLowerCase().includes(query) ||
        challenge.ownerName.toLowerCase().includes(query)
      );
    });
    return filtered;
  }, [publicChallenges, publicQuery]);

  const overallStats = useMemo(() => {
    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    const daily = buildDailyTotals(entries);
    const streaks = computeStreaks(daily, todayIso());
    const bestDay = Array.from(daily.entries()).reduce(
      (best, [date, count]) => (count > best.count ? { date, count } : best),
      { date: "", count: 0 }
    );
    const dayCount = daily.size || 1;
    const average = total / dayCount;
    const biggestEntry = entries.reduce((max, entry) => Math.max(max, entry.count), 0);
    const largestSet = entries.reduce((max, entry) => {
      const localMax = entry.sets?.reduce((inner, set) => Math.max(inner, set.reps), 0) ?? 0;
      return Math.max(max, localMax);
    }, 0);
    const mostActiveDay = Array.from(daily.entries()).reduce(
      (best, [date, count]) => (count > best.count ? { date, count } : best),
      { date: "", count: 0 }
    );
    return {
      total,
      average,
      bestDay,
      biggestEntry,
      largestSet,
      mostActiveDay,
      streaks,
    };
  }, [entries]);

  const challengeStats = useMemo<{
    total: number;
    remaining: number;
    paceStatus: "ahead" | "on-pace" | "behind";
    paceOffset: number;
    daysLeft: number;
    requiredPerDay: number;
    streaks: { current: number; longest: number; daysActive: number };
    bestDay: { date: string; count: number };
    average: number;
    cumulativePoints: { x: number; y: number }[];
    targetPoints: { x: number; y: number }[];
    weeks: { label: string; avg: number }[];
  } | null>(() => {
    if (!selectedChallenge) return null;
    const challengeEntries = entries.filter(
      (entry) => entry.challengeId === selectedChallenge.id
    );
    const total = challengeEntries.reduce((sum, entry) => sum + entry.count, 0);
    const daily = buildDailyTotals(challengeEntries);
    const { start, end } = getChallengeWindow(selectedChallenge);
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const boundedToday = today < start ? start : today > end ? end : today;
    const daysTotal = Math.max(daysBetween(start, end) + 1, 1);
    const daysElapsed = Math.max(daysBetween(start, boundedToday) + 1, 1);
    const expectedByNow = (selectedChallenge.targetNumber / daysTotal) * daysElapsed;
    const paceOffset = total - expectedByNow;
    const paceStatus =
      paceOffset > 0.5 ? "ahead" : paceOffset < -0.5 ? "behind" : "on-pace";
    const remaining = Math.max(selectedChallenge.targetNumber - total, 0);
    const daysLeft = Math.max(daysBetween(boundedToday, end), 0);
    const requiredPerDay = daysLeft > 0 ? remaining / daysLeft : remaining;
    const streaks = computeStreaks(daily, toIsoDate(boundedToday));
    const bestDay = Array.from(daily.entries()).reduce(
      (best, [date, count]) => (count > best.count ? { date, count } : best),
      { date: "", count: 0 }
    );
    const average = total / Math.max(streaks.daysActive || daysElapsed, 1);
    const cumulativePoints = Array.from({ length: daysTotal }).map((_, index) => {
      const date = addDays(start, index);
      const iso = toIsoDate(date);
      const tally = Array.from(daily.entries()).reduce(
        (sum, [day, count]) => (day <= iso ? sum + count : sum),
        0
      );
      return { x: index, y: tally };
    });
    const targetPoints = Array.from({ length: daysTotal }).map((_, index) => ({
      x: index,
      y: (selectedChallenge.targetNumber / daysTotal) * (index + 1),
    }));
    const weeks = Array.from({ length: 6 }).map((_, index) => {
      const weekStart = addDays(startOfWeek(new Date()), -(5 - index) * 7);
      const weekEnd = addDays(weekStart, 6);
      const totalWeek = challengeEntries
        .filter((entry) => entry.date >= toIsoDate(weekStart) && entry.date <= toIsoDate(weekEnd))
        .reduce((sum, entry) => sum + entry.count, 0);
      return {
        label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        avg: totalWeek / 7,
      };
    });
    return {
      total,
      remaining,
      paceStatus,
      paceOffset,
      daysLeft,
      requiredPerDay,
      streaks,
      bestDay,
      average,
      cumulativePoints,
      targetPoints,
      weeks,
    };
  }, [entries, selectedChallenge]);

  return (
    <div
      style={{
        width: "min(960px, 100%)",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: muted,
            }}
          >
            Entries
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "32px" }}>Log today</h1>
          <p style={{ margin: "6px 0 0", color: muted }}>
            Quick marks, honest progress, and calm pacing.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <StatusPill label={syncLabel} tone={syncTone} />
          <button
            type="button"
            onClick={startNew}
            style={{
              height: "44px",
              padding: "0 24px",
              borderRadius: "999px",
              border: `1px solid ${ink}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add entry
          </button>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            background: "#fff5f5",
            padding: "12px 16px",
            color: accent,
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            padding: "18px",
            color: muted,
          }}
        >
          Loading entries...
        </div>
      ) : null}

      {!loading && !challenges.length ? (
        <div
          style={{
            borderRadius: "18px",
            border: `1px solid ${surfaceEdge}`,
            padding: "18px",
            background: "#ffffff",
            display: "grid",
            gap: "10px",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Create a challenge first.</p>
          <p style={{ margin: 0, color: muted, fontSize: "14px" }}>
            Entries attach to a challenge. Add one before logging progress.
          </p>
          <button
            type="button"
            onClick={startNew}
            style={{
              height: "40px",
              padding: "0 20px",
              borderRadius: "999px",
              border: `1px solid ${ink}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start a challenge
          </button>
        </div>
      ) : null}

      {!loading && challenges.length && !entries.length ? (
        <EmptyState onAdd={startNew} />
      ) : null}

      {todayEntries.length ? (
        <DayStrip entries={todayEntries} reducedMotion={prefersReducedMotion} />
      ) : null}

      {showForm ? (
        <EntryForm
          draft={draft}
          onChange={setDraft}
          onCancel={() => setShowForm(false)}
          onSave={handleSave}
          challengeOptions={challenges}
        />
      ) : null}

      <section
        style={{
          display: "grid",
          gap: "16px",
          borderRadius: "20px",
          border: `1px solid ${surfaceEdge}`,
          padding: "18px",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Dashboard highlights
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              Honest totals at a glance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWeeklySummaryOpen(true)}
            style={{
              height: "36px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              background: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Weekly summary
          </button>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatusCard label="Total marks" value={`${overallStats.total}`} />
          <StatusCard
            label="Today"
            value={`${todayEntries.reduce((sum, entry) => sum + entry.count, 0)}`}
          />
          <StatusCard
            label="Best streak"
            value={`${overallStats.streaks.longest}`}
            detail="Across all entries"
          />
          <StatusCard
            label="Pace status"
            value={selectedChallenge ? (challengeStats?.paceStatus ?? "—") : "Select challenge"}
          />
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatusCard
            label="Best day"
            value={
              overallStats.bestDay.count
                ? `${formatDisplayDate(overallStats.bestDay.date)} (${overallStats.bestDay.count})`
                : "—"
            }
          />
          <StatusCard
            label="Longest streak"
            value={`${overallStats.streaks.longest}`}
          />
          <StatusCard
            label="Daily average"
            value={overallStats.average.toFixed(1)}
            detail="Across active days"
          />
          <StatusCard label="Most active day" value={overallStats.mostActiveDay.count ? formatDisplayDate(overallStats.mostActiveDay.date) : "—"} />
        </div>
      </section>

      <section style={{ display: "grid", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Challenge stats
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              Select a challenge to see pace and streaks.
            </p>
          </div>
          <select
            value={selectedChallengeId}
            onChange={(event) => setSelectedChallengeId(event.target.value)}
            style={{
              height: "36px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              padding: "0 12px",
              fontSize: "13px",
              background: "#ffffff",
            }}
          >
            <option value="">Choose a challenge</option>
            {challenges.map((challenge) => (
              <option key={challenge.id} value={challenge.id}>
                {challenge.name}
              </option>
            ))}
          </select>
        </div>
        {selectedChallenge && challengeStats ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <PaceCallout
              status={challengeStats.paceStatus}
              message={
                challengeStats.paceStatus === "ahead"
                  ? `Ahead by ${Math.abs(Math.round(challengeStats.paceOffset))} marks.`
                  : challengeStats.paceStatus === "behind"
                    ? `Catch up ${Math.abs(Math.round(challengeStats.paceOffset))} marks to get on pace.`
                    : "Right on pace. Keep the rhythm."
              }
            />
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <StatusCard label="Total" value={`${challengeStats.total}`} />
              <StatusCard label="Remaining" value={`${challengeStats.remaining}`} />
              <StatusCard
                label="Days left"
                value={`${challengeStats.daysLeft}`}
                detail={`${challengeStats.requiredPerDay.toFixed(1)} / day`}
              />
              <StatusCard label="Best day" value={challengeStats.bestDay.count ? `${formatDisplayDate(challengeStats.bestDay.date)} (${challengeStats.bestDay.count})` : "—"} />
              <StatusCard label="Current streak" value={`${challengeStats.streaks.current}`} />
              <StatusCard label="Longest streak" value={`${challengeStats.streaks.longest}`} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: muted }}>Cumulative progress</p>
              <CumulativeChart
                points={challengeStats.cumulativePoints}
                targetPoints={challengeStats.targetPoints}
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "12px", color: muted }}>Weekly average</p>
              <WeeklyAverageChart weeks={challengeStats.weeks} />
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: "16px",
              border: `1px dashed ${surfaceEdge}`,
              padding: "16px",
              color: muted,
            }}
          >
            Choose a challenge to see pace, streaks, and charts.
          </div>
        )}
      </section>

      <section
        style={{
          display: "grid",
          gap: "12px",
          borderRadius: "20px",
          border: `1px solid ${surfaceEdge}`,
          padding: "18px",
          background: surface,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Yearly heatmap
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              Tap a day to open the drilldown.
            </p>
          </div>
          <p style={{ margin: 0, color: muted }}>
            {selectedChallenge ? selectedChallenge.year : new Date().getFullYear()}
          </p>
        </div>
        <Heatmap
          year={selectedChallenge?.year ?? new Date().getFullYear()}
          dailyTotals={dailyTotals}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </section>

      <section
        style={{
          display: "grid",
          gap: "12px",
          borderRadius: "20px",
          border: `1px solid ${surfaceEdge}`,
          padding: "18px",
          background: "#ffffff",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: muted,
          }}
        >
          Personal records
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <StatusCard
            label="Best single day"
            value={overallStats.bestDay.count ? `${overallStats.bestDay.count} marks` : "—"}
            detail={overallStats.bestDay.date ? formatDisplayDate(overallStats.bestDay.date) : undefined}
          />
          <StatusCard
            label="Longest streak"
            value={`${overallStats.streaks.longest}`}
            detail="Across all entries"
          />
          <StatusCard
            label="Highest daily average"
            value={`${overallStats.average.toFixed(1)}`}
          />
          <StatusCard
            label="Most active days"
            value={`${overallStats.streaks.daysActive}`}
          />
          <StatusCard label="Biggest single entry" value={`${overallStats.biggestEntry || 0}`} />
          <StatusCard label="Max reps in a set" value={`${overallStats.largestSet || 0}`} />
        </div>
      </section>

      <WeeklySummaryDialog
        open={weeklySummaryOpen}
        onClose={() => setWeeklySummaryOpen(false)}
        weekOffset={weekOffset}
        onChangeWeek={setWeekOffset}
        entries={entries}
        challenges={challenges}
      />

      <section style={{ display: "grid", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Week view
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              Tap a day for drilldown.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", color: muted }}>Filter challenge</label>
            <select
              value={draft.challengeId}
              onChange={(event) => setDraft({ ...draft, challengeId: event.target.value })}
              style={{
                height: "36px",
                borderRadius: "999px",
                border: `1px solid ${surfaceEdge}`,
                padding: "0 12px",
                fontSize: "13px",
                background: "#ffffff",
              }}
            >
              <option value="">All challenges</option>
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <WeekOverview
          entries={entriesForDrilldown}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />

        <Drilldown
          entries={entriesForDrilldown}
          selectedDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>

      <section
        style={{
          display: "grid",
          gap: "12px",
          borderRadius: "20px",
          border: `1px solid ${surfaceEdge}`,
          padding: "18px",
          background: surface,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: muted,
            }}
          >
            Totals
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>{totalMarks} marks</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {entries
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 4)
            .map((entry) => (
              <div
                key={entry.id}
                style={{
                  borderRadius: "16px",
                  border: `1px solid ${surfaceEdge}`,
                  padding: "12px",
                  minWidth: "160px",
                  background: "#ffffff",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>{entry.count} marks</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: muted }}>
                  {formatDisplayDate(entry.date)}
                </p>
              </div>
            ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: "16px",
          borderRadius: "20px",
          border: `1px solid ${surfaceEdge}`,
          padding: "18px",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: muted,
              }}
            >
              Community
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "18px", fontWeight: 600 }}>
              Public challenges, real totals.
            </p>
          </div>
          <input
            value={publicQuery}
            onChange={(event) => setPublicQuery(event.target.value)}
            placeholder="Search by challenge or owner"
            style={{
              height: "36px",
              borderRadius: "999px",
              border: `1px solid ${surfaceEdge}`,
              padding: "0 14px",
              minWidth: "220px",
              fontSize: "13px",
            }}
          />
        </div>
        {!publicChallenges.length ? (
          <p style={{ margin: 0, color: muted }}>
            No public challenges yet. Toggle one of yours to public to appear here.
          </p>
        ) : publicFiltered.length ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {publicFiltered.map((challenge) => {
              const isOwner = challenges.some((mine) => mine.id === challenge.id);
              const isFollowing = followingCardIds.has(challenge.id);
              const isPending = pendingFollows.has(challenge.id);
              return (
                <PublicChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isOwner={isOwner}
                  isFollowing={isFollowing}
                  isPending={isPending}
                  disabled={followSyncing === challenge.id}
                  onToggle={() => {
                    void handleToggleFollow(challenge.id);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: muted }}>No challenges match that search.</p>
        )}
        {followed.length ? (
          <div style={{ display: "grid", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "12px", color: muted }}>Following</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {followed.map((record) => {
                const challenge = publicChallenges.find((item) => item.id === record.challengeId);
                if (!challenge) return null;
                return (
                  <div
                    key={record.id}
                    style={{
                      borderRadius: "999px",
                      border: `1px solid ${surfaceEdge}`,
                      padding: "6px 12px",
                      fontSize: "12px",
                      background: surface,
                    }}
                  >
                    {challenge.name}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      {offlineQueue.length ? (
        <div
          style={{
            borderRadius: "16px",
            border: `1px solid ${surfaceEdge}`,
            background: "#fffaf0",
            padding: "12px 16px",
            color: "#7a5a10",
            fontSize: "13px",
          }}
        >
          {offlineQueue.length} entries queued for sync when you're back online.
        </div>
      ) : null}

      <DataPortability />
    </div>
  );
}
