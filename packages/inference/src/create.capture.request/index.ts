// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import type { CaptureRequest } from "../capture.request/index.ts";

const createCaptureRequest = function (
  origin: string,
  changes: Partial<CaptureRequest> = {},
): CaptureRequest {
  return {
    messageFormat: Protocol.MessageFormatEnum.ANTHROPIC_MESSAGES,
    provider: Protocol.ProviderEnum.ANTHROPIC,
    model: Protocol.ModelEnum.CLAUDE_SONNET_5_5,
    name: "plain",
    shows: "A synthetic loopback exchange.",
    url: `${origin}/v1/messages`,
    body: JSON.stringify({
      model: "synthetic-model",
      max_tokens: 32,
      messages: [],
      stream: true,
    }),
    ...changes,
  };
};

export default createCaptureRequest;
