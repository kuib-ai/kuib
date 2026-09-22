// @context @journal/domains/core#^C010
import { z } from "zod";
import MessageID from "../../id/message.id/index.ts";
import SessionID from "../../id/session.id/index.ts";
import DiscussionID from "../../id/discussion.id/index.ts";

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
