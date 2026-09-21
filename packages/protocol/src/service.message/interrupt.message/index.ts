// @context @journal/protocol-design
import { z } from "zod";
import { ServiceMessageTypeEnum } from "../service.message.type.enum/index.ts";
import SessionID from "../../id/session.id/index.ts";

const InterruptMessage = z.object({
  type: z.literal(ServiceMessageTypeEnum.INTERRUPT),
  sessionID: SessionID,
});
type InterruptMessage = z.infer<typeof InterruptMessage>;

export default InterruptMessage;
export type { InterruptMessage };
