// @context @journal/protocol-design
import { z } from "zod";

const ProviderID = z.string().min(1).brand("ProviderID");
type ProviderID = z.infer<typeof ProviderID>;

export default ProviderID;
export type { ProviderID };
