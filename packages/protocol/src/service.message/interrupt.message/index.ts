// @claim core/service-control-protocol
import { z } from "zod";
import { ServiceMessageTypeEnum } from "../service.message.type.enum/index.ts";
import SessionID from "../../id/session.id/index.ts";

// @claim core/service-control-protocol
const InterruptMessage = z.object({
  type: z.literal(ServiceMessageTypeEnum.INTERRUPT),
  sessionID: SessionID,
});
type InterruptMessage = z.infer<typeof InterruptMessage>;

export default InterruptMessage;
export type { InterruptMessage };
