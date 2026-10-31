// @claim core/provider-captures
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import frames from "../parse.response.frames/index.ts";

const { object } = ParseCaptureJsonUnit;

const usageOf = function (body: Uint8Array): Record<string, unknown> | null {
  let usage: Record<string, unknown> | null = null;
  for (const frame of frames(new TextDecoder().decode(body))) {
    const values = object(frame.usage) ?? object(object(frame.message)?.usage);
    if (values !== null) usage = Object.assign({}, usage, values);
  }
  return usage;
};

export default usageOf;
