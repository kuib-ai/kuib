// @context @journal/protocol-design
import { z } from "zod";

const ModelID = z.string().min(1).brand("ModelID");
type ModelID = z.infer<typeof ModelID>;

export default ModelID;
export type { ModelID };
