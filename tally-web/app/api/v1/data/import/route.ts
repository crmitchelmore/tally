import { jsonError, jsonOk } from "../../_lib/response";
import { requireUserId } from "../../_lib/auth";
import { replaceAllData } from "../../_lib/store";
import { withApiTrace } from "../../_lib/telemetry";

type Payload = {
  challenges?: Array<Record<string, unknown>>;
  entries?: Array<Record<string, unknown>>;
  followed?: Array<Record<string, unknown>>;
};

const allowedTimeframes = new Set(["year", "month", "custom"]);
const allowedFeelings = new Set([
  "very-easy",
  "easy",
  "moderate",
  "hard",
  "very-hard",
]);

function isIsoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: Request) {
  return withApiTrace(request, "api.v1.data.import", async () => {
    const userId = await requireUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    const payload = (await request.json()) as Payload;
    const errors: string[] = [];

    const challenges = Array.isArray(payload.challenges) ? payload.challenges : [];
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const followed = Array.isArray(payload.followed) ? payload.followed : [];

    const challengeIds = new Set<string>();
    const normalizedChallenges = challenges.map((item, index) => {
      const id = typeof item.id === "string" ? item.id : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const targetNumber = Number(item.targetNumber);
      const color = typeof item.color === "string" ? item.color : "";
      const icon = typeof item.icon === "string" ? item.icon : "";
      const timeframeUnit = typeof item.timeframeUnit === "string" ? item.timeframeUnit : "";
      const year = Number(item.year);
      const isPublic = Boolean(item.isPublic);
      const archived = Boolean(item.archived);
      const startDate = isIsoDate(item.startDate) ? (item.startDate as string) : undefined;
      const endDate = isIsoDate(item.endDate) ? (item.endDate as string) : undefined;
      const createdAt =
        typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();

      if (!id) errors.push(`challenges[${index}].id is required`);
      if (!name) errors.push(`challenges[${index}].name is required`);
      if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
        errors.push(`challenges[${index}].targetNumber must be > 0`);
      }
      if (!color) errors.push(`challenges[${index}].color is required`);
      if (!icon) errors.push(`challenges[${index}].icon is required`);
      if (!allowedTimeframes.has(timeframeUnit)) {
        errors.push(`challenges[${index}].timeframeUnit must be year, month, or custom`);
      }
      if (!Number.isFinite(year)) errors.push(`challenges[${index}].year is required`);
      if (startDate === undefined && item.startDate !== undefined) {
        errors.push(`challenges[${index}].startDate must be YYYY-MM-DD`);
      }
      if (endDate === undefined && item.endDate !== undefined) {
        errors.push(`challenges[${index}].endDate must be YYYY-MM-DD`);
      }

      if (id) challengeIds.add(id);

      return {
        id,
        userId,
        name,
        targetNumber,
        color,
        icon,
        timeframeUnit: timeframeUnit as "year" | "month" | "custom",
        startDate,
        endDate,
        year,
        isPublic,
        archived,
        createdAt,
      };
    });

    const normalizedEntries = entries.map((item, index) => {
      const id = typeof item.id === "string" ? item.id : "";
      const challengeId = typeof item.challengeId === "string" ? item.challengeId : "";
      const date = isIsoDate(item.date) ? (item.date as string) : "";
      const count = Number(item.count);
      const note = typeof item.note === "string" ? item.note : undefined;
      const feeling = typeof item.feeling === "string" ? item.feeling : undefined;
      const sets = Array.isArray(item.sets) ? item.sets : undefined;
      const createdAt =
        typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();

      if (!id) errors.push(`entries[${index}].id is required`);
      if (!challengeId) errors.push(`entries[${index}].challengeId is required`);
      if (!date) errors.push(`entries[${index}].date must be YYYY-MM-DD`);
      if (!Number.isFinite(count) || count <= 0) {
        errors.push(`entries[${index}].count must be > 0`);
      }
      if (feeling && !allowedFeelings.has(feeling)) {
        errors.push(
          `entries[${index}].feeling must be very-easy, easy, moderate, hard, or very-hard`
        );
      }
      if (sets && !sets.every((set) => typeof set?.reps === "number")) {
        errors.push(`entries[${index}].sets must be { reps: number }[]`);
      }
      if (challengeId && !challengeIds.has(challengeId)) {
        errors.push(`entries[${index}].challengeId does not match any challenge`);
      }

      return {
        id,
        userId,
        challengeId,
        date,
        count,
        note,
        feeling: feeling as
          | "very-easy"
          | "easy"
          | "moderate"
          | "hard"
          | "very-hard"
          | undefined,
        sets: sets as { reps: number }[] | undefined,
        createdAt,
      };
    });

    const normalizedFollowed = followed.map((item, index) => {
      const id = typeof item.id === "string" ? item.id : "";
      const challengeId = typeof item.challengeId === "string" ? item.challengeId : "";
      const followedAt =
        typeof item.followedAt === "string" ? item.followedAt : new Date().toISOString();
      if (!id) errors.push(`followed[${index}].id is required`);
      if (!challengeId) errors.push(`followed[${index}].challengeId is required`);
      if (challengeId && !challengeIds.has(challengeId)) {
        errors.push(`followed[${index}].challengeId does not match any challenge`);
      }
      return {
        id,
        userId,
        challengeId,
        followedAt,
      };
    });

    if (errors.length) return jsonError(errors.join(", "), 400);

    const data = replaceAllData(userId, {
      challenges: normalizedChallenges,
      entries: normalizedEntries,
      followed: normalizedFollowed,
    });

    return jsonOk(data, 201);
  });
}
