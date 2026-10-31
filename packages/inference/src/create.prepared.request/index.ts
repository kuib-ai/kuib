// @claim core/provider-captures
import Protocol from "@kuib-ai/protocol";
import type { PreparedRequest } from "../prepared.request/index.ts";

const createPreparedRequest = function (
  changes: Partial<PreparedRequest> = {},
): PreparedRequest {
  return {
    messageFormat: Protocol.MessageFormatEnum.OPENAI_CHAT,
    provider: Protocol.ProviderEnum.META,
    model: Protocol.ModelEnum.MUSE_SPARK_1_1,
    name: "case",
    method: "POST",
    url: "https://api.meta.ai/v1/chat/completions",
    authHeader: "authorization",
    headers: {
      "content-type": "application/json",
      "accept-encoding": "identity",
    },
    ...changes,
  };
};

export default createPreparedRequest;
