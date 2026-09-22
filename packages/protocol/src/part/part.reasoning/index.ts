// @context @journal/domains/core#^C008
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import PartBase from "../part.base/index.ts";

const PartReasoning = PartBase.extend({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
});
type PartReasoning = z.infer<typeof PartReasoning>;

export default PartReasoning;
export type { PartReasoning };
