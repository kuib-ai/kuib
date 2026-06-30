// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";

const MessageFailed = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_FAILED),
  messageID: MessageID,
  error: z.string(),
  completedAt: z.number(),
});
type MessageFailed = z.infer<typeof MessageFailed>;

export default MessageFailed;
export type { MessageFailed };
