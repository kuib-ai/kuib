// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const CheckpointID = z.string().min(1).brand("CheckpointID");
type CheckpointID = z.infer<typeof CheckpointID>;

export default CheckpointID;
export type { CheckpointID };
