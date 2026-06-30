// @context @journal/protocol-design
import { z } from "zod";
import MessageUser from "../message.user";
import MessageAssistant from "../message.assistant";

const AnyMessage = z.discriminatedUnion("role", [
  MessageUser,
  MessageAssistant,
]);
type AnyMessage = z.infer<typeof AnyMessage>;

export default AnyMessage;
export type { AnyMessage };
