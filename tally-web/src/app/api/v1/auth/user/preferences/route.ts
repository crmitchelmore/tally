import { requireAuth, isAuthError } from "../../../_lib/auth";
import { getUserByClerkId, updateUserPreferences } from "../../../_lib/store";
import {
  jsonOk,
  jsonBadRequest,
  jsonNotFound,
  jsonInternalError,
} from "../../../_lib/response";
import type { DashboardConfig } from "../../../_lib/types";

/**
 * GET /api/v1/auth/user/preferences
 * Get user preferences including dashboard configuration
 */
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const user = await getUserByClerkId(authResult.userId);
    if (!user) {
      return jsonNotFound("User not found");
    }

    return jsonOk({
      dashboardConfig: user.dashboardConfig ?? getDefaultDashboardConfig(),
    });
  } catch (error) {
    console.error("Error in GET /api/v1/auth/user/preferences:", error);
    return jsonInternalError();
  }
}

/**
 * PATCH /api/v1/auth/user/preferences
 * Update user preferences
 */
export async function PATCH(request: Request) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const user = await getUserByClerkId(authResult.userId);
    if (!user) {
      return jsonNotFound("User not found");
    }

    const body = await request.json();
    const { dashboardConfig } = body;

    if (dashboardConfig && !isValidDashboardConfig(dashboardConfig)) {
      return jsonBadRequest("Invalid dashboard configuration");
    }

    await updateUserPreferences(user.id, { dashboardConfig });

    return jsonOk({
      dashboardConfig: dashboardConfig ?? user.dashboardConfig ?? getDefaultDashboardConfig(),
    });
  } catch (error) {
    console.error("Error in PATCH /api/v1/auth/user/preferences:", error);
    return jsonInternalError();
  }
}

function getDefaultDashboardConfig(): DashboardConfig {
  return {
    panels: {
      highlights: true,
      personalRecords: true,
      progressGraph: true,
      burnUpChart: true,
      setsStats: true,
    },
  };
}

function isValidDashboardConfig(config: unknown): config is DashboardConfig {
  if (!config || typeof config !== "object") return false;
  const c = config as Record<string, unknown>;
  if (!c.panels || typeof c.panels !== "object") return false;
  const panels = c.panels as Record<string, unknown>;
  return (
    typeof panels.highlights === "boolean" &&
    typeof panels.personalRecords === "boolean" &&
    typeof panels.progressGraph === "boolean" &&
    typeof panels.burnUpChart === "boolean" &&
    typeof panels.setsStats === "boolean"
  );
}
