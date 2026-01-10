import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk: NodeSDK | undefined;

export async function registerOpenTelemetry() {
  if (sdk) return;

  // Avoid noisy failures locally; only start when configured.
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT || !process.env.OTEL_EXPORTER_OTLP_HEADERS) {
    return;
  }

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
    sdk?.shutdown().catch(() => {});
  });
}
