// @context @journal/protocol-design
import { MessageRoleEnum } from "./message.role.enum";
import { MessageAssistantStatusEnum } from "./message.assistant.status.enum";
import { MessageAssistantErrorKindEnum } from "./message.assistant.error.kind.enum";
import MessageUser from "./message.user";
import MessageAssistant from "./message.assistant";
import MessageAssistantError from "./message.assistant.error";
import AnyMessage from "./message.any";

const Message = {
  MessageRoleEnum,
  MessageAssistantStatusEnum,
  MessageAssistantErrorKindEnum,
  MessageUser,
  MessageAssistant,
  MessageAssistantError,
  AnyMessage,
};

export default Message;
