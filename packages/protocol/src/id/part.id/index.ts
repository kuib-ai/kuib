// @context @journal/protocol-design
import { z } from "zod";

const PartID = z.string().min(1).brand("PartID");
type PartID = z.infer<typeof PartID>;

export default PartID;
export type { PartID };
