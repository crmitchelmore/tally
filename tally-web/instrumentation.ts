/**
 * OTel initialization for Next.js (instrumentation.ts)
 *
 * This file is automatically loaded by Next.js for instrumentation.
 * It sets up OpenTelemetry tracing with Honeycomb export.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const semconv = await import("@opentelemetry/semantic-conventions");

    const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY;
    const ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
    const APP_VERSION = process.env.npm_package_version || "0.1.0";

    // Skip if no Honeycomb key
    if (!HONEYCOMB_API_KEY) {
      console.log("[OTel] Skipping - no HONEYCOMB_API_KEY");
      return;
    }

    const traceExporter = new OTLPTraceExporter({
      url: "https://api.honeycomb.io/v1/traces",
      headers: {
        "x-honeycomb-team": HONEYCOMB_API_KEY,
        "x-honeycomb-dataset": "tally-web",
      },
    });

    // Use standard attribute names from semantic conventions
    const serviceName = semconv.ATTR_SERVICE_NAME || "service.name";
    const serviceVersion = semconv.ATTR_SERVICE_VERSION || "service.version";

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [serviceName]: "tally-web",
        [serviceVersion]: APP_VERSION,
        "deployment.environment": ENV,
      }),
      traceExporter,
    });

    sdk.start();
    console.log("[OTel] Tracing initialized for Honeycomb");

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk.shutdown().catch(console.error);
    });
  }
}
