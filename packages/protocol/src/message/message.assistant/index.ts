// @context @journal/protocol-design
import { z } from "zod";
import { MessageRoleEnum } from "../message.role.enum";
import { MessageAssistantStatusEnum } from "../message.assistant.status.enum";
import MessageBase from "../message.base";
import PartAssistant from "../../part/part.assistant";
import MessageAssistantError from "../message.assistant.error";

const MessageAssistantSuccess = MessageBase.extend({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  parts: z.array(PartAssistant),
  status: z.literal(MessageAssistantStatusEnum.SUCCESS),
  completedAt: z.number(),
});
type MessageAssistantSuccess = z.infer<typeof MessageAssistantSuccess>;

const MessageAssistant = z.discriminatedUnion("status", [
  MessageAssistantSuccess,
  MessageAssistantError,
]);
type MessageAssistant = z.infer<typeof MessageAssistant>;

export default MessageAssistant;
export type { MessageAssistant, MessageAssistantSuccess };
