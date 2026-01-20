/**
 * GET /api/v1/followed - List followed challenges
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  getFollowsByUser,
  getChallengeById,
  getEntriesByChallenge,
  getFollowerCount,
  users,
} from "../_lib/store";
import { jsonOk, jsonInternalError } from "../_lib/response";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const follows = getFollowsByUser(authResult.userId);

    // Get challenge details for each follow
    const followedChallenges = follows
      .map((f) => {
        const challenge = getChallengeById(f.challengeId);
        if (!challenge || !challenge.isPublic) return null;

        // Get total reps
        const entries = getEntriesByChallenge(challenge.id);
        const totalReps = entries.reduce((sum, e) => sum + e.count, 0);

        // Get progress percentage
        const progress =
          challenge.target > 0
            ? Math.min(100, (totalReps / challenge.target) * 100)
            : 0;

        // Get follower count
        const followerCount = getFollowerCount(challenge.id);

        // Get owner info
        const owner = Array.from(users.values()).find(
          (u) => u.id === challenge.userId
        );

        return {
          ...challenge,
          totalReps,
          progress: Math.round(progress * 10) / 10,
          followerCount,
          isFollowing: true,
          followedAt: f.createdAt,
          owner: owner
            ? { id: owner.id, name: owner.name }
            : { id: challenge.userId, name: "Unknown" },
        };
      })
      .filter(Boolean);

    return jsonOk({ challenges: followedChallenges });
  } catch (error) {
    console.error("Error in GET /api/v1/followed:", error);
    return jsonInternalError();
  }
}
