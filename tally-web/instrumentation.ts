/**
 * OTel initialization for Next.js (instrumentation.ts)
 *
 * This file is automatically loaded by Next.js for instrumentation.
 * It sets up OpenTelemetry tracing, metrics, and logs with Honeycomb export.
 *
 * All three signals (traces, metrics, logs) are sent to Honeycomb via OTLP.
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { OTLPMetricExporter } = await import(
      "@opentelemetry/exporter-metrics-otlp-http"
    );
    const { OTLPLogExporter } = await import(
      "@opentelemetry/exporter-logs-otlp-http"
    );
    const { PeriodicExportingMetricReader } = await import(
      "@opentelemetry/sdk-metrics"
    );
    const {
      LoggerProvider,
      SimpleLogRecordProcessor,
    } = await import("@opentelemetry/sdk-logs");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const semconv = await import("@opentelemetry/semantic-conventions");
    const { logs } = await import("@opentelemetry/api-logs");

    const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY;
    const ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
    const APP_VERSION = process.env.npm_package_version || "0.1.0";
    const DATASET = process.env.HONEYCOMB_DATASET || "tally-web";

    // Skip if no Honeycomb key
    if (!HONEYCOMB_API_KEY) {
      console.log("[OTel] Skipping - no HONEYCOMB_API_KEY");
      return;
    }

    const honeycombHeaders = {
      "x-honeycomb-team": HONEYCOMB_API_KEY,
      "x-honeycomb-dataset": DATASET,
    };

    // Traces exporter
    const traceExporter = new OTLPTraceExporter({
      url: "https://api.honeycomb.io/v1/traces",
      headers: honeycombHeaders,
    });

    // Metrics exporter (exports every 30s)
    const metricExporter = new OTLPMetricExporter({
      url: "https://api.honeycomb.io/v1/metrics",
      headers: honeycombHeaders,
    });

    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 30000,
    });

    // Logs exporter
    const logExporter = new OTLPLogExporter({
      url: "https://api.honeycomb.io/v1/logs",
      headers: honeycombHeaders,
    });

    // Use standard attribute names from semantic conventions
    const serviceName = semconv.ATTR_SERVICE_NAME || "service.name";
    const serviceVersion = semconv.ATTR_SERVICE_VERSION || "service.version";

    const resource = resourceFromAttributes({
      [serviceName]: "tally-web",
      [serviceVersion]: APP_VERSION,
      "deployment.environment": ENV,
    });

    // Set up LoggerProvider with processors passed via constructor (new API)
    const loggerProvider = new LoggerProvider({
      resource,
      processors: [new SimpleLogRecordProcessor(logExporter)],
    });
    logs.setGlobalLoggerProvider(loggerProvider);

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader,
    });

    sdk.start();
    console.log(`[OTel] Initialized for Honeycomb (traces, metrics, logs) - dataset: ${DATASET}`);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      await Promise.all([
        sdk.shutdown(),
        loggerProvider.shutdown(),
      ]).catch(console.error);
    });
  }
}
