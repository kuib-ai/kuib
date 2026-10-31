// @claim core/provider-captures
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import frames from "../parse.response.frames/index.ts";

const { object } = ParseCaptureJsonUnit;

const stopOf = function (
  status: number | null,
  body: Uint8Array,
): string | null {
  if (status === 401 || status === 403) return "authentication-failure";
  if (status === 402) return "billing-failure";
  for (const frame of frames(new TextDecoder().decode(body))) {
    const error = object(frame.error);
    if (error === null) continue;
    const type = String(error.type ?? error.code ?? "");
    if (/authentication_error|permission_error|invalid_api_key/.test(type))
      return "authentication-failure";
    if (
      /billing_error|insufficient_quota|quota_exceeded|credit_balance/.test(
        type,
      ) ||
      /spend.?cap|insufficient.?credits|exhausted.?balance|insufficient.?balance/i.test(
        String(error.message ?? ""),
      )
    )
      return "billing-failure";
  }
  return null;
};

export default stopOf;
