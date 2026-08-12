// @context @journal/protocol-design
import { ServiceMessageTypeEnum } from "./service.message.type.enum";
import SubmitMessage from "./submit.message";
import InterruptMessage from "./interrupt.message";
import ServiceMessageAny from "./service.message.any";

const ServiceMessage = {
  ServiceMessageTypeEnum,
  SubmitMessage,
  InterruptMessage,
  ServiceMessageAny,
};

export default ServiceMessage;
