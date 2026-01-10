import { LaunchDarkly } from "@convex-dev/launchdarkly";
import { components } from "../_generated/api";

/**
 * LaunchDarkly client for server-side feature flag evaluation in Convex.
 * 
 * Usage in a Convex function:
 * ```ts
 * import { launchdarkly } from "./lib/launchdarkly";
 * 
 * export const myQuery = query({
 *   handler: async (ctx) => {
 *     const ld = launchdarkly.sdk(ctx);
 *     const isEnabled = await ld.boolVariation("streaks-enabled", { key: userId }, false);
 *     // ...
 *   },
 * });
 * ```
 */
export const launchdarkly = new LaunchDarkly(components.launchdarkly);

/**
 * Helper to evaluate a boolean flag with a user context.
 */
export async function isFlagEnabled(
  ctx: Parameters<typeof launchdarkly.sdk>[0],
  flagKey: string,
  userKey: string,
  defaultValue = false
): Promise<boolean> {
  const ld = launchdarkly.sdk(ctx);
  return ld.boolVariation(flagKey, { key: userKey }, defaultValue);
}

/**
 * Helper to get all flag values for a user context.
 */
export async function getAllFlags(
  ctx: Parameters<typeof launchdarkly.sdk>[0],
  userKey: string
): Promise<Record<string, unknown>> {
  const ld = launchdarkly.sdk(ctx);
  return ld.allFlagsState({ key: userKey }).then((state) => state.allValues());
}
