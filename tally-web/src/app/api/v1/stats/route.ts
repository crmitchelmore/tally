/**
 * GET /api/v1/stats - Get dashboard stats and personal records
 */
import { requireAuth, isAuthError } from "../_lib/auth";
import {
  calculateDashboardStats,
  calculatePersonalRecords,
} from "../_lib/store";
import { jsonOk, jsonInternalError } from "../_lib/response";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const dashboardStats = await calculateDashboardStats(authResult.userId);
    const personalRecords = await calculatePersonalRecords(authResult.userId);

    return jsonOk({
      dashboard: dashboardStats,
      records: personalRecords,
    });
  } catch (error) {
    console.error("Error in GET /api/v1/stats:", error);
    return jsonInternalError();
  }
}
