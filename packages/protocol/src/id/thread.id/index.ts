// @context @journal/domains/core#^C004
import { z } from "zod";

const ThreadID = z.string().min(1).brand("ThreadID");
type ThreadID = z.infer<typeof ThreadID>;

export default ThreadID;
export type { ThreadID };
