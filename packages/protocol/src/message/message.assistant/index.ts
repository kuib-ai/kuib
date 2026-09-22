// @claim core/protocol-messages
import { z } from "zod";
import { MessageRoleEnum } from "../message.role.enum/index.ts";
import { MessageAssistantStatusEnum } from "../message.assistant.status.enum/index.ts";
import MessageBase from "../message.base/index.ts";
import PartAssistant from "../../part/part.assistant/index.ts";
import MessageAssistantError from "../message.assistant.error/index.ts";

const MessageAssistantSuccess = MessageBase.extend({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  parts: z.array(PartAssistant),
  status: z.literal(MessageAssistantStatusEnum.SUCCESS),
  completedAt: z.number(),
});
type MessageAssistantSuccess = z.infer<typeof MessageAssistantSuccess>;

// @claim core/protocol-messages
const MessageAssistant = z.discriminatedUnion("status", [
  MessageAssistantSuccess,
  MessageAssistantError,
]);
type MessageAssistant = z.infer<typeof MessageAssistant>;

export default MessageAssistant;
export type { MessageAssistant, MessageAssistantSuccess };
