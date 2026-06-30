// @context @journal/protocol-design
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum";
import PartBase from "../part.base";

const PartFile = PartBase.extend({
  type: z.literal(PartTypeEnum.FILE),
  mime: z.string(),
  filename: z.string().optional(),
  url: z.string(),
});
type PartFile = z.infer<typeof PartFile>;

export default PartFile;
export type { PartFile };
