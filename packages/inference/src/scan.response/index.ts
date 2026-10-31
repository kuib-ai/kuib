// @claim core/provider-captures
import withError from "@kuib-ai/std/with.error";
import type { LedgerEntry } from "../ledger.entry/index.ts";
import type { ScanDiagnosis } from "../scan.diagnosis/index.ts";
import RefuseCaptureUnit from "../refuse.capture/index.ts";
import ScanSensitiveBytesUnit from "../scan.sensitive.bytes/index.ts";

const { CaptureError } = RefuseCaptureUnit;
const { ENCODER, scan } = ScanSensitiveBytesUnit;

const scanResponse = function (input: {
  bytes: Uint8Array;
  requestBody: string;
  organizationId: string | undefined;
  metadata: unknown;
  transport: Record<string, unknown>;
  finished: LedgerEntry;
  values: string[];
  kinds: Pick<ScanDiagnosis, "kind" | "header">[];
}): {
  transport: Record<string, unknown>;
  bodyValues: string[];
  diagnosis: ScanDiagnosis | null;
} {
  const organizationIdPermitted =
    input.organizationId !== undefined &&
    [input.bytes, ENCODER.encode(input.requestBody)].some(function (body) {
      const [error] = withError(
        function () {
          scan(body, [input.organizationId!]);
        },
        function (cause) {
          return cause;
        },
      );
      if (error === null) return false;
      if (error instanceof CaptureError && error.match !== undefined)
        return true;
      throw error;
    });
  const transport = organizationIdPermitted
    ? { ...input.transport, anthropicOrganizationId: true }
    : input.transport;
  const bodyValues = input.values.map(function (value, index) {
    return input.kinds[index]?.header === "anthropic-organization-id"
      ? ""
      : value;
  });
  let blob: ScanDiagnosis["blob"] = "response-body";
  const [error] = withError(
    function () {
      for (const [name, data] of [
        ["response-body", input.bytes],
        ["response-metadata", ENCODER.encode(JSON.stringify(input.metadata))],
        ["transport-metadata", ENCODER.encode(JSON.stringify(transport))],
        ["ledger-entry", ENCODER.encode(JSON.stringify(input.finished))],
      ] as [ScanDiagnosis["blob"], Uint8Array][]) {
        blob = name;
        if (name === "response-body") {
          scan(data, bodyValues);
          continue;
        }
        scan(data, input.values);
      }
    },
    function (cause) {
      return cause;
    },
  );
  if (error === null) return { transport, bodyValues, diagnosis: null };
  if (!(error instanceof CaptureError) || error.match === undefined)
    throw error;
  const { index, ...match } = error.match;
  return {
    transport,
    bodyValues,
    diagnosis: { ...input.kinds[index]!, ...match, blob },
  };
};

export default scanResponse;
