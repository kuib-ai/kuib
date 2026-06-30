// @context @journal/protocol-design
import { z } from "zod";

const SessionID = z.string().min(1).brand("SessionID");
type SessionID = z.infer<typeof SessionID>;

export default SessionID;
export type { SessionID };
