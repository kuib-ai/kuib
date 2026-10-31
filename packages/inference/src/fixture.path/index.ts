// @claim core/inference-fixtures
import { join } from "node:path";
import type { MessageFormatEnum } from "@kuib-ai/protocol/message.format.enum";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { ModelEnum } from "@kuib-ai/protocol/model.enum";

// @claim core/inference-fixtures
const fixturePath = function (
  messageFormat: MessageFormatEnum,
  provider: ProviderEnum,
  model: ModelEnum,
  name: string,
): string {
  return join(messageFormat, provider, model, name);
};

export default fixturePath;
