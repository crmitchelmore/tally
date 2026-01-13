import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { logs } from "@opentelemetry/api-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk: NodeSDK | undefined;
let loggerProvider: LoggerProvider | undefined;

export async function registerOpenTelemetry() {
  if (sdk) return;

  // Avoid noisy failures locally; only start when configured.
  if (
    !process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    !process.env.OTEL_EXPORTER_OTLP_HEADERS
  ) {
    return;
  }

  // Set up log exporter with processor passed via config
  const logExporter = new OTLPLogExporter();
  loggerProvider = new LoggerProvider({
    processors: [new BatchLogRecordProcessor(logExporter)],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Keep signal high; can expand later.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  await sdk.start();

  process.on("SIGTERM", () => {
    loggerProvider?.shutdown().catch(() => {});
    sdk?.shutdown().catch(() => {});
  });
}

/**
 * Get an OTEL logger for emitting structured logs to Grafana Loki.
 * Usage:
 *   const logger = getOtelLogger();
 *   logger.emit({ body: "User signed in", severityText: "INFO", attributes: { userId: "123" } });
 */
export function getOtelLogger(name: string = "tally-web") {
  const provider = logs.getLoggerProvider();
  return provider.getLogger(name);
}
