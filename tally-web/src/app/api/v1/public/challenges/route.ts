/**
 * GET /api/v1/public/challenges - List public challenges
 */
import { requireAuth, isAuthError } from "../../_lib/auth";
import {
  getPublicChallenges,
  getFollowerCount,
  isFollowing,
  getEntriesByChallenge,
  getUserByClerkId,
} from "../../_lib/store";
import { jsonOk, jsonInternalError } from "../../_lib/response";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();

    let publicChallenges = await getPublicChallenges();

    // Filter by search if provided
    if (search) {
      publicChallenges = publicChallenges.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.icon.toLowerCase().includes(search)
      );
    }

    // Aggregate data for each challenge
    const challengesWithMetaPromises = publicChallenges.map(async (c) => {
      // Get total reps (sum of entries)
      const entries = await getEntriesByChallenge(c.id);
      const totalReps = entries.reduce((sum, e) => sum + e.count, 0);

      // Get progress percentage
      const progress = c.target > 0 ? Math.min(100, (totalReps / c.target) * 100) : 0;

      // Get follower count
      const followerCount = await getFollowerCount(c.id);

      // Check if current user is following
      const following = await isFollowing(authResult.userId, c.id);

      // Get owner info
      const owner = await getUserByClerkId(c.userId);

      return {
        ...c,
        totalReps,
        progress: Math.round(progress * 10) / 10,
        followerCount,
        isFollowing: following,
        owner: owner
          ? { id: owner.id, name: owner.name }
          : { id: c.userId, name: "Unknown" },
      };
    });

    const challengesWithMeta = await Promise.all(challengesWithMetaPromises);

    return jsonOk({ challenges: challengesWithMeta });
  } catch (error) {
    console.error("Error in GET /api/v1/public/challenges:", error);
    return jsonInternalError();
  }
}
