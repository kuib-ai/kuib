// @context @journal/protocol-design
import { EventTypeEnum } from "./event.type.enum";
import UserMessageSubmitted from "./user.message.submitted";
import MessageStarted from "./message.started";
import MessageUpdated from "./message.updated";
import StepStarted from "./step.started";
import StepFinished from "./step.finished";
import TextDelta from "./text.delta";
import ReasoningDelta from "./reasoning.delta";
import ToolCallStarted from "./tool.call.started";
import ToolCallOutputDelta from "./tool.call.output.delta";
import ToolCallCompleted from "./tool.call.completed";
import ToolCallFailed from "./tool.call.failed";
import MessageCompleted from "./message.completed";
import MessageFailed from "./message.failed";
import AnyEvent from "./event.any";
import EventEnvelope from "./event.envelope";

const Event = {
  EventTypeEnum,
  UserMessageSubmitted,
  MessageStarted,
  MessageUpdated,
  StepStarted,
  StepFinished,
  TextDelta,
  ReasoningDelta,
  ToolCallStarted,
  ToolCallOutputDelta,
  ToolCallCompleted,
  ToolCallFailed,
  MessageCompleted,
  MessageFailed,
  AnyEvent,
  EventEnvelope,
};

export default Event;
