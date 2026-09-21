// @context @journal/protocol-design
import { z } from "zod";
import UserMessageSubmitted from "../user.message.submitted/index.ts";
import MessageStarted from "../message.started/index.ts";
import MessageUpdated from "../message.updated/index.ts";
import StepStarted from "../step.started/index.ts";
import StepFinished from "../step.finished/index.ts";
import TextDelta from "../text.delta/index.ts";
import ReasoningDelta from "../reasoning.delta/index.ts";
import ToolCallStarted from "../tool.call.started/index.ts";
import ToolCallOutputDelta from "../tool.call.output.delta/index.ts";
import ToolCallCompleted from "../tool.call.completed/index.ts";
import ToolCallFailed from "../tool.call.failed/index.ts";
import MessageCompleted from "../message.completed/index.ts";
import MessageFailed from "../message.failed/index.ts";

const AnyEvent = z.discriminatedUnion("type", [
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
]);
type AnyEvent = z.infer<typeof AnyEvent>;

export default AnyEvent;
export type { AnyEvent };
