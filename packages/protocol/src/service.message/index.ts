// @context @journal/protocol-design
import { ServiceMessageTypeEnum } from "./service.message.type.enum/index.ts";
import SubmitMessage from "./submit.message/index.ts";
import InterruptMessage from "./interrupt.message/index.ts";
import ServiceMessageAny from "./service.message.any/index.ts";

const ServiceMessage = {
  ServiceMessageTypeEnum,
  SubmitMessage,
  InterruptMessage,
  ServiceMessageAny,
};

export default ServiceMessage;
