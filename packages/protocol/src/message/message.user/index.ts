// @context @journal/protocol-design
import { z } from "zod";
import { MessageRoleEnum } from "../message.role.enum";
import MessageBase from "../message.base";
import PartUser from "../../part/part.user";
import DeviceID from "../../id/device.id";

const MessageUser = MessageBase.extend({
  role: z.literal(MessageRoleEnum.USER),
  parts: z.array(PartUser),
  originDeviceID: DeviceID,
});
type MessageUser = z.infer<typeof MessageUser>;

export default MessageUser;
export type { MessageUser };
