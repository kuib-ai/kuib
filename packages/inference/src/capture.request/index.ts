// @claim core/provider-captures
import type { ModelEnum } from "@kuib-ai/protocol/model.enum";
import type { ProviderEnum } from "@kuib-ai/protocol/provider.enum";
import type { MessageFormatEnum } from "@kuib-ai/protocol/message.format.enum";

export type CaptureRequest = {
  messageFormat: MessageFormatEnum;
  provider: ProviderEnum;
  model: ModelEnum;
  name: string;
  shows: string;
  url: string;
  headers?: Record<string, string>;
  authHeader?: string;
  body: string;
  replay?: { fixture: string; changes: string[] };
};
