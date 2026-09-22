// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const ModelID = z.string().min(1).brand("ModelID");
type ModelID = z.infer<typeof ModelID>;

export default ModelID;
export type { ModelID };
