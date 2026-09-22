// @claim core/protocol-parts
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import PartBase from "../part.base/index.ts";

// @claim core/protocol-parts
const PartText = PartBase.extend({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
});
type PartText = z.infer<typeof PartText>;

export default PartText;
export type { PartText };
