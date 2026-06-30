// @context @journal/protocol-design
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum";
import PartBase from "../part.base";

const PartReasoning = PartBase.extend({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
});
type PartReasoning = z.infer<typeof PartReasoning>;

export default PartReasoning;
export type { PartReasoning };
