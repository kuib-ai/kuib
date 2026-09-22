// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const MessageID = z.string().min(1).brand("MessageID");
type MessageID = z.infer<typeof MessageID>;

export default MessageID;
export type { MessageID };
