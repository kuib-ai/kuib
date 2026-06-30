// @context @journal/protocol-design
import { z } from "zod";
import PartID from "../../id/part.id";

const PartBase = z.object({
  partID: PartID,
  excluded: z.boolean(),
});
type PartBase = z.infer<typeof PartBase>;

export default PartBase;
export type { PartBase };
