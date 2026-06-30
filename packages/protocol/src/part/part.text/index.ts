// @context @journal/protocol-design
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum";
import PartBase from "../part.base";

const PartText = PartBase.extend({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
});
type PartText = z.infer<typeof PartText>;

export default PartText;
export type { PartText };
