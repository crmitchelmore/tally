import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY;
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "tally-web";
const OTEL_SERVICE_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

if (process.env.OTEL_DIAGNOSTICS_LOG_LEVEL === "debug") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

function resolveEndpoint() {
  if (OTEL_EXPORTER_OTLP_ENDPOINT) return OTEL_EXPORTER_OTLP_ENDPOINT;
  return "https://api.honeycomb.io/v1/traces";
}

function resolveHeaders() {
  if (!HONEYCOMB_API_KEY) return undefined;
  return { "x-honeycomb-team": HONEYCOMB_API_KEY };
}

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
  [ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION ?? "",
});
const exporter = new OTLPTraceExporter({
  url: resolveEndpoint(),
  headers: resolveHeaders(),
});
const tracerProvider = new NodeTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(exporter)],
});
tracerProvider.register();

process.on("SIGTERM", () => {
  void tracerProvider.shutdown();
});
