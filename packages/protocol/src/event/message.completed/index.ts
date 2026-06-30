// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";

const MessageCompleted = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_COMPLETED),
  messageID: MessageID,
  completedAt: z.number(),
});
type MessageCompleted = z.infer<typeof MessageCompleted>;

export default MessageCompleted;
export type { MessageCompleted };
