// @context @journal/domains/core#^C010
import { MessageRoleEnum } from "./message.role.enum/index.ts";
import { MessageAssistantStatusEnum } from "./message.assistant.status.enum/index.ts";
import { MessageAssistantErrorKindEnum } from "./message.assistant.error.kind.enum/index.ts";
import MessageUser from "./message.user/index.ts";
import MessageAssistant from "./message.assistant/index.ts";
import MessageAssistantError from "./message.assistant.error/index.ts";
import AnyMessage from "./message.any/index.ts";

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
