// @context @journal/protocol-design
import { z } from "zod";
import ProviderID from "../id/provider.id";
import ModelID from "../id/model.id";

const ModelRef = z.object({
  providerID: ProviderID,
  modelID: ModelID,
});
type ModelRef = z.infer<typeof ModelRef>;

export default ModelRef;
export type { ModelRef };
