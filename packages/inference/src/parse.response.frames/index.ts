// @claim core/provider-captures
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import withError from "@kuib-ai/std/with.error";

const { object } = ParseCaptureJsonUnit;

const frames = function (text: string): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  const [wholeError, wholeValue] = withError(function () {
    return JSON.parse(text);
  });
  if (wholeError === null) {
    const whole = object(wholeValue);
    if (whole !== null) result.push(whole);
    return result;
  }
  for (const event of text.split(/\r?\n\r?\n/)) {
    const data = event
      .split(/\r?\n/)
      .filter(function (line) {
        return line.startsWith("data:");
      })
      .map(function (line) {
        return line.slice(5).trimStart();
      })
      .join("\n");
    if (data === "" || data === "[DONE]") continue;
    const [error, value] = withError(function () {
      return JSON.parse(data);
    });
    if (error !== null) continue;
    const frame = object(value);
    if (frame !== null) result.push(frame);
  }
  return result;
};

export default frames;
