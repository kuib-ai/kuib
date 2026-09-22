// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const DiscussionID = z.string().min(1).brand("DiscussionID");
type DiscussionID = z.infer<typeof DiscussionID>;

export default DiscussionID;
export type { DiscussionID };
