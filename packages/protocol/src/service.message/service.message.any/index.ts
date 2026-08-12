// @context @journal/protocol-design
import { z } from "zod";
import SubmitMessage from "../submit.message";
import InterruptMessage from "../interrupt.message";

const ServiceMessageAny = z.discriminatedUnion("type", [
  SubmitMessage,
  InterruptMessage,
]);
type ServiceMessageAny = z.infer<typeof ServiceMessageAny>;

export default ServiceMessageAny;
export type { ServiceMessageAny };
