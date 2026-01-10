// This file is used to register server-side instrumentation for Next.js.
// It's automatically loaded by Next.js when the app starts on the server.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // OTel must live in a Node-only module so Edge bundles don't see Node APIs.
    const { registerOpenTelemetry } = await import("./otel.node");
    await registerOpenTelemetry();

    // Import server config for Node.js runtime
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Import edge config for Edge runtime
    await import("./sentry.edge.config");
  }
}
