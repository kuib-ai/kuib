// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const ThreadID = z.string().min(1).brand("ThreadID");
type ThreadID = z.infer<typeof ThreadID>;

export default ThreadID;
export type { ThreadID };
