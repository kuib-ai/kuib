// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { RecordInput } from "../record.input/index.ts";
import ParseCaptureJsonUnit from "../parse.capture.json/index.ts";
import frames from "../parse.response.frames/index.ts";

const { object } = ParseCaptureJsonUnit;

const cutAt = function (
  text: string,
  kind: RecordInput["cut"],
  provider: ProviderEnum,
): boolean {
  return frames(text).some(function (frame) {
    const delta = object(frame.delta);
    if (kind === "thinking" && delta?.type === "thinking_delta") return true;
    if (kind === "text" && delta?.type === "text_delta") return true;
    const choices = Array.isArray(frame.choices) ? frame.choices : [];
    return choices.some(function (choice) {
      const change = object(object(choice)?.delta);
      const field =
        kind === "thinking" ? change?.reasoning_content : change?.content;
      return (
        (typeof field === "string" && field.length > 0) ||
        (kind === "thinking" &&
          provider === Protocol.ProviderEnum.META &&
          typeof change?.content === "string" &&
          change.content.length > 0)
      );
    });
  });
};

export default cutAt;
