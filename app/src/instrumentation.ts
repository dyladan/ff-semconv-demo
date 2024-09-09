import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  MetricReader,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  SimpleLogRecordProcessor,
  LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { SpanExporter } from "@opentelemetry/sdk-trace-node";

import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
// Optional and only needed to see the internal diagnostic logging (during development)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
console.log("loading instrumentation");

const resource = Resource.default()
  .merge(
    new Resource({
      [ATTR_SERVICE_NAME]: "feature-flag-semconv-demo",
      [ATTR_SERVICE_VERSION]: "0.1.0",
    })
  );

const headers: Partial<Record<string, string>> = {};
if (process.env.OTLP_AUTHORIZATION_HEADER) {
  headers["Authorization"] = process.env.OTLP_AUTHORIZATION_HEADER;
}

let traceExporter: SpanExporter | undefined;;
if (process.env.OTLP_TRACE_URL) {
  traceExporter = new OTLPTraceExporter({
    url: process.env.OTLP_TRACE_URL,
    headers,
  })
}

let metricReader: MetricReader | undefined;;
if (process.env.OTLP_METRICS_URL) {
  metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTLP_METRICS_URL,
      headers,
    }),
  })
}

let logRecordProcessor: LogRecordProcessor | undefined;;
if (process.env.OTLP_LOGS_URL) {
  logRecordProcessor = new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: process.env.OTLP_LOGS_URL,
      headers,
    })
  )
}

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessor,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
    }),
  ],
});

sdk.start();
