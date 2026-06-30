// @context @journal/protocol-design
import { z } from "zod";

const DiscussionID = z.string().min(1).brand("DiscussionID");
type DiscussionID = z.infer<typeof DiscussionID>;

export default DiscussionID;
export type { DiscussionID };
