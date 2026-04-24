import { z } from "zod";
import {
  SessionID,
  MessageID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
} from "./id.js";

// ---------------------------------------------------------------------------
// RuntimeMetadata
// model provider, token usage primitives
// ---------------------------------------------------------------------------
export const TokenUsage = z.object({
  input: z.number().int(),
  output: z.number().int(),
  reasoning: z.number().int().optional(),
  cache: z
    .object({
      read: z.number().int(),
      write: z.number().int(),
    })
    .optional(),
});
export type TokenUsage = z.infer<typeof TokenUsage>;
export const ModelRef = z.object({
  providerID: ProviderID,
  modelID: ModelID,
});
export type ModelRef = z.infer<typeof ModelRef>;

// ---------------------------------------------------------------------------
// ToolCallPart primitives
// ---------------------------------------------------------------------------
export enum ToolCallStatusEnum {
  PENDING = "pending",
  COMPLETED = "completed",
  ERROR = "error",
}
export const ToolCallPending = z.object({
  status: z.literal(ToolCallStatusEnum.PENDING),
  input: z.record(z.string(), z.unknown()),
  title: z.string(),
  startedAt: z.number(),
});
export type ToolCallPending = z.infer<typeof ToolCallPending>;
export enum ToolCallKindEnum {
  NORMAL = "normal",
  SUBAGENT = "subagent",
}
export const ToolCallCompletedBase = z.object({
  status: z.literal(ToolCallStatusEnum.COMPLETED),
  kind: z.enum(ToolCallKindEnum),
  output: z.string(),
  completedAt: z.number(),
});
export const ToolCallCompletedNormal = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
export const ToolCallCompletedSubagent = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
export const ToolCallCompleted = z.discriminatedUnion("kind", [
  ToolCallCompletedNormal,
  ToolCallCompletedSubagent,
]);
export type ToolCallCompleted = z.infer<typeof ToolCallCompleted>;

export enum ToolCallErrorReasonEnum {
  FAILED = "failed",
  INTERRUPTED = "interrupted",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}
export const ToolCallErrorBase = z.object({
  status: z.literal(ToolCallStatusEnum.ERROR),
  reason: z.enum(ToolCallErrorReasonEnum),
  kind: z.enum(ToolCallKindEnum),
  error: z.string(),
  completedAt: z.number(),
});
export const ToolCallErrorNormal = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
export const ToolCallErrorSubagent = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
export const ToolCallError = z.discriminatedUnion("kind", [
  ToolCallErrorNormal,
  ToolCallErrorSubagent,
]);
export type ToolCallError = z.infer<typeof ToolCallError>;

export const ToolCallState = z.discriminatedUnion("status", [
  ToolCallPending,
  ToolCallCompleted,
  ToolCallError,
]);
export type ToolCallState = z.infer<typeof ToolCallState>;

// ---------------------------------------------------------------------------
// Part primitives for message formation
// ---------------------------------------------------------------------------
export enum PartTypeEnum {
  STEP_BOUNDARY = "step-boundary",
  TEXT = "text",
  REASONING = "reasoning",
  FILE = "file",
  TOOL_CALL = "tool-call",
}

export const TextPart = z.object({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
});
export type TextPart = z.infer<typeof TextPart>;

export const ReasoningPart = z.object({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
});
export type ReasoningPart = z.infer<typeof ReasoningPart>;

export const FilePart = z.object({
  type: z.literal(PartTypeEnum.FILE),
  mime: z.string(),
  filename: z.string().optional(),
  url: z.string(),
});
export type FilePart = z.infer<typeof FilePart>;

export const ToolCallPart = z.object({
  type: z.literal(PartTypeEnum.TOOL_CALL),
  callID: ToolCallID,
  tool: z.string(),
  state: ToolCallState,
});
export type ToolCallPart = z.infer<typeof ToolCallPart>;

export enum StepBoundaryKindEnum {
  STEP_START = "step-start",
  STEP_STOP = "step-stop",
}
export const StepBoundaryPartBase = z.object({
  type: z.literal(PartTypeEnum.STEP_BOUNDARY),
});
export const StepBoundaryStartPart = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_START),
});
export enum StepBoundaryStopReasonEnum {
  INTERRUPTED = "interrupted",
  TOOL_CALL_REQUEST = "tool-call-request",
  NORMAL = "normal",
}
export const StepBoundaryStopPart = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_STOP),
  reason: z.enum(StepBoundaryStopReasonEnum),
  model: ModelRef,
  tokens: TokenUsage,
});
export const StepBoundaryPart = z.discriminatedUnion("kind", [
  StepBoundaryStartPart,
  StepBoundaryStopPart,
]);

export const Part = z.discriminatedUnion("type", [
  TextPart,
  ReasoningPart,
  FilePart,
  ToolCallPart,
  StepBoundaryPart,
]);
export type Part = z.infer<typeof Part>;

export enum MessageRoleEnum {
  USER = "user",
  ASSISTANT = "assistant",
}
export const MessageUser = z.object({
  role: z.literal(MessageRoleEnum.USER),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  parts: z.array(Part),
  createdAt: z.number(),
});
export type MessageUser = z.infer<typeof MessageUser>;

export enum MessageAssistantStatusEnum {
  SUCCESS = "success",
  ERROR = "error",
}
export const MessageAssistantBase = z.object({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  parts: z.array(Part),
  createdAt: z.number(),
});
export const MessageAssistantSuccess = MessageAssistantBase.extend({
  status: z.literal(MessageAssistantStatusEnum.SUCCESS),
  completedAt: z.number(),
});

export enum MessageAssistantErrorKindEnum {
  API = "api",
  CONTEXT_OVERFLOW = "context_overflow",
  UNKNOWN = "unknown",
}
export const MessageAssistantErrorBase = MessageAssistantBase.extend({
  status: z.literal(MessageAssistantStatusEnum.ERROR),
});
export const MessageAssistantErrorApi = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.API),
  statusCode: z.number(),
});
export const MessageAssistantErrorUnknown = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.UNKNOWN),
});
export const MessageAssistantErrorContextOverflow =
  MessageAssistantErrorBase.extend({
    kind: z.literal(MessageAssistantErrorKindEnum.CONTEXT_OVERFLOW),
  });

export const MessageAssistantError = z.discriminatedUnion("kind", [
  MessageAssistantErrorApi,
  MessageAssistantErrorUnknown,
  MessageAssistantErrorContextOverflow,
]);
export type MessageAssistantErrorApi = z.infer<typeof MessageAssistantErrorApi>;
export type MessageAssistantErrorUnknown = z.infer<
  typeof MessageAssistantErrorUnknown
>;
export type MessageAssistantErrorContextOverflow = z.infer<
  typeof MessageAssistantErrorContextOverflow
>;

export const MessageAssistant = z.discriminatedUnion("status", [
  MessageAssistantSuccess,
  MessageAssistantError,
]);
export type MessageAssistantSuccess = z.infer<typeof MessageAssistantSuccess>;
export type MessageAssistantError = z.infer<typeof MessageAssistantError>;

export const Message = z.discriminatedUnion("role", [
  MessageUser,
  MessageAssistant,
]);
export type MessageAssistant = z.infer<typeof MessageAssistant>;

export type Message = z.infer<typeof Message>;
