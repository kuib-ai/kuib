// @context @journal/protocol-design
export enum EventTypeEnum {
  USER_MESSAGE_SUBMITTED = "user-message-submitted",
  MESSAGE_STARTED = "message-started",
  MESSAGE_UPDATED = "message-updated",
  STEP_STARTED = "step-started",
  STEP_FINISHED = "step-finished",
  TEXT_DELTA = "text-delta",
  REASONING_DELTA = "reasoning-delta",
  TOOL_CALL_STARTED = "tool-call-started",
  TOOL_CALL_OUTPUT_DELTA = "tool-call-output-delta",
  TOOL_CALL_COMPLETED = "tool-call-completed",
  TOOL_CALL_FAILED = "tool-call-failed",
}
