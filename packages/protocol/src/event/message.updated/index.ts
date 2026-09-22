// @claim core/protocol-events
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import AnyMessage from "../../message/message.any/index.ts";

// @claim core/protocol-events
const MessageUpdated = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_UPDATED),
  messageID: MessageID,
  message: AnyMessage,
});
type MessageUpdated = z.infer<typeof MessageUpdated>;

export default MessageUpdated;
export type { MessageUpdated };
