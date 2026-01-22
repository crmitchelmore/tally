/**
 * Soft Delete Pattern - Reusable Helpers
 * 
 * This module documents the soft delete pattern used across the Tally app.
 * All entities support soft delete with the following fields:
 * - deletedAt?: number (timestamp when deleted)
 * - deletedBy?: string (userId who deleted)
 * 
 * ## Pattern Overview
 * 
 * 1. **Convex Schema**: Add `deletedAt` and `deletedBy` optional fields
 * 2. **Convex Queries**: Filter with `isNotDeleted()` helper
 * 3. **Convex Mutations**: 
 *    - `remove`: Sets deletedAt/deletedBy (soft delete)
 *    - `restore`: Clears deletedAt/deletedBy, validates ownership
 * 4. **API Routes**: Pass userId to restore for ownership validation
 * 
 * ## Security Requirements
 * 
 * - ALWAYS validate ownership in Convex mutations BEFORE any mutation
 * - NEVER restore then check ownership (race condition vulnerability)
 * - Pass userId to restore mutations for atomic ownership check
 * 
 * ## Example Implementation
 * 
 * ### Convex Query (getIncludingDeleted)
 * ```typescript
 * export const getIncludingDeleted = query({
 *   args: { id: v.id("myTable") },
 *   handler: async (ctx, args) => {
 *     const doc = await ctx.db.get(args.id);
 *     if (!doc) return null;
 *     return { ...toApiFormat(doc), deletedAt: doc.deletedAt };
 *   },
 * });
 * ```
 * 
 * ### Convex Mutation (restore with ownership)
 * ```typescript
 * export const restore = mutation({
 *   args: { 
 *     id: v.id("myTable"),
 *     userId: v.string(),
 *   },
 *   handler: async (ctx, args) => {
 *     const doc = await ctx.db.get(args.id);
 *     if (!doc) throw new Error("Not found");
 *     
 *     // CRITICAL: Check ownership BEFORE mutation
 *     if (doc.userId !== args.userId) {
 *       throw new Error("Access denied: not owner");
 *     }
 *     
 *     await ctx.db.patch(args.id, { 
 *       deletedAt: undefined,
 *       deletedBy: undefined,
 *     });
 *     
 *     return await ctx.db.get(args.id);
 *   },
 * });
 * ```
 * 
 * ### API Route (restore endpoint)
 * ```typescript
 * export async function POST(request: NextRequest, { params }: RouteParams) {
 *   const authResult = await requireAuth();
 *   if (isAuthError(authResult)) return authResult.response;
 *   
 *   const { id } = await params;
 *   
 *   try {
 *     // Pass userId - ownership validated in Convex mutation
 *     const result = await restoreMyEntity(id, authResult.userId);
 *     return jsonOk({ success: true, data: result });
 *   } catch (err) {
 *     if (err instanceof Error) {
 *       if (err.message.includes("Access denied")) {
 *         return jsonForbidden("Access denied");
 *       }
 *       if (err.message.includes("not found")) {
 *         return jsonNotFound("Not found or already active");
 *       }
 *     }
 *     throw err;
 *   }
 * }
 * ```
 */

/**
 * Standard error messages for soft delete operations
 */
export const SoftDeleteErrors = {
  NOT_FOUND: "not found",
  ACCESS_DENIED: "Access denied: not owner",
  ALREADY_DELETED: "Already deleted",
  NOT_DELETED: "Not deleted",
} as const;

/**
 * Type for entities that support soft delete
 */
export interface SoftDeletable {
  deletedAt?: number;
  deletedBy?: string;
}

/**
 * Check if an error is an access denied error from soft delete
 */
export function isAccessDeniedError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Access denied");
}

/**
 * Check if an error is a not found error from soft delete
 */
export function isNotFoundError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("not found");
}

/**
 * Handle soft delete restore errors and return appropriate response
 */
export function handleRestoreError(
  err: unknown,
  jsonForbidden: (msg: string) => Response,
  jsonNotFound: (msg: string) => Response,
  entityName: string
): Response | null {
  if (isAccessDeniedError(err)) {
    return jsonForbidden("Access denied");
  }
  if (isNotFoundError(err)) {
    return jsonNotFound(`${entityName} not found or already active`);
  }
  return null;
}
