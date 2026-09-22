// @claim core/protocol-messages
import { z } from "zod";
import MessageUser from "../message.user/index.ts";
import MessageAssistant from "../message.assistant/index.ts";

// @claim core/protocol-messages
const AnyMessage = z.discriminatedUnion("role", [
  MessageUser,
  MessageAssistant,
]);
type AnyMessage = z.infer<typeof AnyMessage>;

export default AnyMessage;
export type { AnyMessage };
