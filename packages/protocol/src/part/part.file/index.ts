// @claim core/protocol-parts
import { z } from "zod";
import { PartTypeEnum } from "../part.type.enum/index.ts";
import PartBase from "../part.base/index.ts";

// @claim core/protocol-parts
const PartFile = PartBase.extend({
  type: z.literal(PartTypeEnum.FILE),
  mime: z.string(),
  filename: z.string().optional(),
  url: z.string(),
});
type PartFile = z.infer<typeof PartFile>;

export default PartFile;
export type { PartFile };
