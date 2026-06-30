// @context @journal/protocol-design
import { z } from "zod";
import SubmitMessage from "../submit.message";

const ServiceMessageAny = z.discriminatedUnion("type", [SubmitMessage]);
type ServiceMessageAny = z.infer<typeof ServiceMessageAny>;

export default ServiceMessageAny;
export type { ServiceMessageAny };
