// @context @journal/domains/core#^C006
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum/index.ts";
import MessageID from "../../id/message.id/index.ts";
import PartUser from "../../part/part.user/index.ts";

const UserMessageSubmitted = z.object({
  type: z.literal(EventTypeEnum.USER_MESSAGE_SUBMITTED),
  messageID: MessageID,
  parts: z.array(PartUser),
});
type UserMessageSubmitted = z.infer<typeof UserMessageSubmitted>;

export default UserMessageSubmitted;
export type { UserMessageSubmitted };
