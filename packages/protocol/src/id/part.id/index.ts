// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const PartID = z.string().min(1).brand("PartID");
type PartID = z.infer<typeof PartID>;

export default PartID;
export type { PartID };
