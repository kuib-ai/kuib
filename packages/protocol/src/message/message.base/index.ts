// @context @journal/protocol-design
import { z } from "zod";
import MessageID from "../../id/message.id";
import SessionID from "../../id/session.id";
import DiscussionID from "../../id/discussion.id";

const MessageBase = z.object({
  _version: z.literal(1),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  createdAt: z.number(),
});
type MessageBase = z.infer<typeof MessageBase>;

export default MessageBase;
export type { MessageBase };
