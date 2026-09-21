// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";

const MessageCompleted = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_COMPLETED),
  messageID: MessageID,
  completedAt: z.number(),
});
type MessageCompleted = z.infer<typeof MessageCompleted>;

export default MessageCompleted;
export type { MessageCompleted };
