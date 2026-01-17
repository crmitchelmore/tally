type TimeframeUnit = "year" | "month" | "custom";

export function parseBoolean(value: string | null) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateChallengePayload(payload: Record<string, unknown>) {
  const errors: string[] = [];
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const targetNumber = Number(payload.targetNumber);
  const color = typeof payload.color === "string" ? payload.color : "";
  const icon = typeof payload.icon === "string" ? payload.icon : "";
  const timeframeUnit = payload.timeframeUnit as TimeframeUnit;
  const year = Number(payload.year);
  const isPublic = Boolean(payload.isPublic);
  const archived = Boolean(payload.archived);
  const startDate = typeof payload.startDate === "string" ? payload.startDate : undefined;
  const endDate = typeof payload.endDate === "string" ? payload.endDate : undefined;

  if (!name) errors.push("name is required");
  if (!Number.isFinite(targetNumber) || targetNumber <= 0) errors.push("targetNumber must be > 0");
  if (!color) errors.push("color is required");
  if (!icon) errors.push("icon is required");
  if (!["year", "month", "custom"].includes(timeframeUnit)) {
    errors.push("timeframeUnit must be year, month, or custom");
  }
  if (!Number.isFinite(year)) errors.push("year is required");
  if (startDate && !isIsoDate(startDate)) errors.push("startDate must be YYYY-MM-DD");
  if (endDate && !isIsoDate(endDate)) errors.push("endDate must be YYYY-MM-DD");

  return {
    errors,
    value: {
      name,
      targetNumber,
      color,
      icon,
      timeframeUnit,
      year,
      startDate,
      endDate,
      isPublic,
      archived,
    },
  };
}

export function validateEntryPayload(payload: Record<string, unknown>) {
  type Feeling = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";
  const errors: string[] = [];
  const challengeId = typeof payload.challengeId === "string" ? payload.challengeId : "";
  const date = typeof payload.date === "string" ? payload.date : "";
  const count = Number(payload.count);
  const note = typeof payload.note === "string" ? payload.note : undefined;
  const feeling =
    payload.feeling === undefined
      ? undefined
      : (payload.feeling as Feeling);
  const sets = Array.isArray(payload.sets) ? payload.sets : undefined;

  if (!challengeId) errors.push("challengeId is required");
  if (!date || !isIsoDate(date)) errors.push("date must be YYYY-MM-DD");
  if (!Number.isFinite(count) || count <= 0) errors.push("count must be > 0");
  if (
    feeling &&
    !["very-easy", "easy", "moderate", "hard", "very-hard"].includes(feeling)
  ) {
    errors.push("feeling must be very-easy, easy, moderate, hard, or very-hard");
  }
  if (sets && !sets.every((set) => typeof set?.reps === "number")) {
    errors.push("sets must be { reps: number }[]");
  }

  return {
    errors,
    value: {
      challengeId,
      date,
      count,
      note,
      feeling,
      sets,
    },
  };
}
