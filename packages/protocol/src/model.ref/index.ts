// @context @journal/domains/core#^C011
import { z } from "zod";
import ProviderID from "../id/provider.id/index.ts";
import ModelID from "../id/model.id/index.ts";

const ModelRef = z.object({
  providerID: ProviderID,
  modelID: ModelID,
});
type ModelRef = z.infer<typeof ModelRef>;

export default ModelRef;
export type { ModelRef };
