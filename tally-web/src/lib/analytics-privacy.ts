const urlProperties = ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"];

/** Remove URL credentials, search and fragments, including initial person properties. */
export function scrubAnalyticsURLs(properties: Record<string, unknown>) {
  for (const key of urlProperties) {
    const value = properties[key];
    if (typeof value !== "string") continue;
    try {
      const url = new URL(value);
      properties[key] = url.origin + url.pathname;
    } catch { delete properties[key]; }
  }
  for (const key of ["$set", "$set_once"]) {
    const nested = properties[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      // These SDK property groups are flat; avoid following arbitrary nested data.
      for (const field of urlProperties) {
        const value = (nested as Record<string, unknown>)[field];
        if (typeof value !== "string") continue;
        try {
          const url = new URL(value);
          (nested as Record<string, unknown>)[field] = url.origin + url.pathname;
        } catch { delete (nested as Record<string, unknown>)[field]; }
      }
    }
  }
}
