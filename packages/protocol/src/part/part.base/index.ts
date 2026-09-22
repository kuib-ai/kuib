// @claim core/protocol-parts
import { z } from "zod";
import PartID from "../../id/part.id/index.ts";

// @claim core/protocol-parts
const PartBase = z.object({
  partID: PartID,
  excluded: z.boolean(),
});
type PartBase = z.infer<typeof PartBase>;

export default PartBase;
export type { PartBase };
