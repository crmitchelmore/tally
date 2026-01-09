/**
 * Adapter functions to convert Convex documents to application types.
 * Convex uses `_id` while our application uses `id`.
 */
import type { Challenge, Entry, User } from "@/types";
import type { Doc } from "../../convex/_generated/dataModel";

/**
 * Convert a Convex challenge document to application Challenge type
 */
export function toChallenge(doc: Doc<"challenges">): Challenge {
  return {
    id: doc._id as string,
    userId: doc.userId as string,
    name: doc.name,
    targetNumber: doc.targetNumber,
    year: doc.year,
    color: doc.color,
    icon: doc.icon,
    timeframeUnit: doc.timeframeUnit,
    startDate: doc.startDate,
    endDate: doc.endDate,
    isPublic: doc.isPublic,
    archived: doc.archived,
    createdAt: doc.createdAt,
  };
}

/**
 * Convert an array of Convex challenge documents
 */
export function toChallenges(docs: Doc<"challenges">[]): Challenge[] {
  return docs.map(toChallenge);
}

/**
 * Convert a Convex entry document to application Entry type
 */
export function toEntry(doc: Doc<"entries">): Entry {
  return {
    id: doc._id as string,
    userId: doc.userId as string,
    challengeId: doc.challengeId as string,
    date: doc.date,
    count: doc.count,
    note: doc.note,
    sets: doc.sets,
    feeling: doc.feeling,
    createdAt: doc.createdAt,
  };
}

/**
 * Convert an array of Convex entry documents
 */
export function toEntries(docs: Doc<"entries">[]): Entry[] {
  return docs.map(toEntry);
}

/**
 * Convert a Convex user document to application User type
 */
export function toUser(doc: Doc<"users">): User {
  return {
    id: doc._id as string,
    clerkId: doc.clerkId,
    email: doc.email,
    name: doc.name,
    avatarUrl: doc.avatarUrl,
    createdAt: doc.createdAt,
  };
}
