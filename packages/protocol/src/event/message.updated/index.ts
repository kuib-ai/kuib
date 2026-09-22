// @context @journal/domains/core#^C006
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import AnyMessage from "../../message/message.any/index.ts";

const MessageUpdated = z.object({
  type: z.literal(EventTypeEnum.MESSAGE_UPDATED),
  messageID: MessageID,
  message: AnyMessage,
});
type MessageUpdated = z.infer<typeof MessageUpdated>;

export default MessageUpdated;
export type { MessageUpdated };
