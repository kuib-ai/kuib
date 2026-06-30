// @context @journal/protocol-design
import { z } from "zod";

const DeviceID = z.string().min(1).brand("DeviceID");
type DeviceID = z.infer<typeof DeviceID>;

export default DeviceID;
export type { DeviceID };
