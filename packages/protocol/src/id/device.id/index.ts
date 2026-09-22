// @claim core/protocol-ids
import { z } from "zod";

// @claim core/protocol-ids
const DeviceID = z.string().min(1).brand("DeviceID");
type DeviceID = z.infer<typeof DeviceID>;

export default DeviceID;
export type { DeviceID };
