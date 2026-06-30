// @context @journal/protocol-design
import { z } from "zod";
import { ServiceMessageTypeEnum } from "../service.message.type.enum";
import SessionID from "../../id/session.id";

const SubmitMessage = z.object({
  type: z.literal(ServiceMessageTypeEnum.SUBMIT),
  sessionID: SessionID,
  prompt: z.string(),
});
type SubmitMessage = z.infer<typeof SubmitMessage>;

export default SubmitMessage;
export type { SubmitMessage };
