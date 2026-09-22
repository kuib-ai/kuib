// @claim core/protocol-events
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";

// @claim core/protocol-events
const MessageStarted = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_STARTED),
  messageID: MessageID,
});
type MessageStarted = z.infer<typeof MessageStarted>;

export default MessageStarted;
export type { MessageStarted };
