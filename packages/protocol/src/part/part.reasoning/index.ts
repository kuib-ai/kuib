// @claim core/protocol-parts
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import PartBase from "../part.base/index.ts";

// @claim core/protocol-parts
const PartReasoning = PartBase.extend({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
});
type PartReasoning = z.infer<typeof PartReasoning>;

export default PartReasoning;
export type { PartReasoning };
