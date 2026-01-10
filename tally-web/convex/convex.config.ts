import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config";

const app = defineApp();

// LaunchDarkly component for server-side feature flag evaluation
app.use(launchdarkly);

export default app;
