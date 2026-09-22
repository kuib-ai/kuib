// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const ProviderID = z.string().min(1).brand("ProviderID");
type ProviderID = z.infer<typeof ProviderID>;

export default ProviderID;
export type { ProviderID };
