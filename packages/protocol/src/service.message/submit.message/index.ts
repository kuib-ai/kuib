// @claim core/service-control-protocol
import { z } from "zod";
import { ServiceMessageTypeEnum } from "../service.message.type.enum/index.ts";
import SessionID from "../../id/session.id/index.ts";

// @claim core/service-control-protocol
const SubmitMessage = z.object({
  type: z.literal(ServiceMessageTypeEnum.SUBMIT),
  sessionID: SessionID,
  prompt: z.string(),
});
type SubmitMessage = z.infer<typeof SubmitMessage>;

export default SubmitMessage;
export type { SubmitMessage };
