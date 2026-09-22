// @context @journal/domains/core#^C004
import { z } from "zod";

const CheckpointID = z.string().min(1).brand("CheckpointID");
type CheckpointID = z.infer<typeof CheckpointID>;

export default CheckpointID;
export type { CheckpointID };
