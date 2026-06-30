// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";
import AnyMessage from "../../message/message.any";

const MessageUpdated = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_UPDATED),
  messageID: MessageID,
  message: AnyMessage,
});
type MessageUpdated = z.infer<typeof MessageUpdated>;

export default MessageUpdated;
export type { MessageUpdated };
