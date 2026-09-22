// @claim core/protocol-messages
import { z } from "zod";
import { MessageRoleEnum } from "../message.role.enum/index.ts";
import { MessageAssistantStatusEnum } from "../message.assistant.status.enum/index.ts";
import { MessageAssistantErrorKindEnum } from "../message.assistant.error.kind.enum/index.ts";
import MessageBase from "../message.base/index.ts";
import PartAssistant from "../../part/part.assistant/index.ts";

const MessageAssistantErrorBase = MessageBase.extend({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  parts: z.array(PartAssistant),
  status: z.literal(MessageAssistantStatusEnum.ERROR),
  error: z.string(),
});

const MessageAssistantErrorApi = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.API),
  statusCode: z.number(),
});
type MessageAssistantErrorApi = z.infer<typeof MessageAssistantErrorApi>;

const MessageAssistantErrorUnknown = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.UNKNOWN),
});
type MessageAssistantErrorUnknown = z.infer<
  typeof MessageAssistantErrorUnknown
>;

const MessageAssistantErrorContextOverflow = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.CONTEXT_OVERFLOW),
});
type MessageAssistantErrorContextOverflow = z.infer<
  typeof MessageAssistantErrorContextOverflow
>;

// @claim core/protocol-messages
const MessageAssistantError = z.discriminatedUnion("kind", [
  MessageAssistantErrorApi,
  MessageAssistantErrorUnknown,
  MessageAssistantErrorContextOverflow,
]);
type MessageAssistantError = z.infer<typeof MessageAssistantError>;

export default MessageAssistantError;
export type {
  MessageAssistantError,
  MessageAssistantErrorApi,
  MessageAssistantErrorUnknown,
  MessageAssistantErrorContextOverflow,
};
