// @claim core/service-control-protocol
import { z } from "zod";
import SubmitMessage from "../submit.message/index.ts";
import InterruptMessage from "../interrupt.message/index.ts";

// @claim core/service-control-protocol
const ServiceMessageAny = z.discriminatedUnion("type", [
  SubmitMessage,
  InterruptMessage,
]);
type ServiceMessageAny = z.infer<typeof ServiceMessageAny>;

export default ServiceMessageAny;
export type { ServiceMessageAny };
