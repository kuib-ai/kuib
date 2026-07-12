// @context @journal/observability
import { registerTelemetry } from "ai";
import { OpenTelemetry } from "@ai-sdk/otel";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { SEMRESATTRS_PROJECT_NAME } from "@arizeai/openinference-semantic-conventions";
import { OpenInferenceSimpleSpanProcessor } from "@arizeai/openinference-vercel";

type StartTelemetryConfig = {
  endpoint: string | undefined;
  serviceName: string | undefined;
};

const startTelemetry = function (config: StartTelemetryConfig): boolean {
  if (config.endpoint === undefined || config.endpoint.length === 0) {
    return false;
  }
  const serviceName = config.serviceName;

  if (serviceName === undefined || serviceName.length === 0) {
    throw new Error("serviceName is required");
  }

  const exporter = new OTLPTraceExporter({
    url: `${config.endpoint}/v1/traces`,
  });
  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_PROJECT_NAME]: serviceName,
    }),
    spanProcessors: [new OpenInferenceSimpleSpanProcessor({ exporter })],
  });
  provider.register();
  registerTelemetry(new OpenTelemetry());
  return true;
};

export default startTelemetry;
export type { StartTelemetryConfig };
