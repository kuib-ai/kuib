// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const SessionID = z.string().min(1).brand("SessionID");
type SessionID = z.infer<typeof SessionID>;

export default SessionID;
export type { SessionID };
