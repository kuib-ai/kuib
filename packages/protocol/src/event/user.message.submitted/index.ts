// @context @journal/protocol-design
import { z } from "zod";
import { EventTypeEnum } from "../event.type.enum";
import MessageID from "../../id/message.id";
import PartUser from "../../part/part.user";

const UserMessageSubmitted = z.object({
  type: z.literal(EventTypeEnum.USER_MESSAGE_SUBMITTED),
  messageID: MessageID,
  parts: z.array(PartUser),
});
type UserMessageSubmitted = z.infer<typeof UserMessageSubmitted>;

export default UserMessageSubmitted;
export type { UserMessageSubmitted };
