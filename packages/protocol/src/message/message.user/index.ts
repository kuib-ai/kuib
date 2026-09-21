// @context @journal/protocol-design
import { z } from "zod";
import { MessageRoleEnum } from "../message.role.enum/index.ts";
import MessageBase from "../message.base/index.ts";
import PartUser from "../../part/part.user/index.ts";
import DeviceID from "../../id/device.id/index.ts";

const MessageUser = MessageBase.extend({
  role: z.literal(MessageRoleEnum.USER),
  parts: z.array(PartUser),
  originDeviceID: DeviceID,
});
type MessageUser = z.infer<typeof MessageUser>;

export default MessageUser;
export type { MessageUser };
