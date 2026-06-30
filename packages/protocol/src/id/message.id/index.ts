// @context @journal/protocol-design
import { z } from "zod";

const MessageID = z.string().min(1).brand("MessageID");
type MessageID = z.infer<typeof MessageID>;

export default MessageID;
export type { MessageID };
