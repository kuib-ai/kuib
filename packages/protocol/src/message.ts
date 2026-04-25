import { z } from "zod";
import {
  SessionID,
  MessageID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
  PartID,
  DeviceID,
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
// ToolCall state primitives
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
const ToolCallCompletedBase = z.object({
  status: z.literal(ToolCallStatusEnum.COMPLETED),
  kind: z.enum(ToolCallKindEnum),
  output: z.string(),
  completedAt: z.number(),
});
export const ToolCallCompletedNormal = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
export type ToolCallCompletedNormal = z.infer<typeof ToolCallCompletedNormal>;
export const ToolCallCompletedSubagent = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
export type ToolCallCompletedSubagent = z.infer<
  typeof ToolCallCompletedSubagent
>;
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
const ToolCallErrorBase = z.object({
  status: z.literal(ToolCallStatusEnum.ERROR),
  reason: z.enum(ToolCallErrorReasonEnum),
  kind: z.enum(ToolCallKindEnum),
  error: z.string(),
  completedAt: z.number(),
});
export const ToolCallErrorNormal = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.NORMAL),
});
export type ToolCallErrorNormal = z.infer<typeof ToolCallErrorNormal>;
export const ToolCallErrorSubagent = ToolCallErrorBase.extend({
  kind: z.literal(ToolCallKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
export type ToolCallErrorSubagent = z.infer<typeof ToolCallErrorSubagent>;
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

const PartBase = z.object({
  partID: PartID,
  excluded: z.boolean(),
});

export const PartText = PartBase.extend({
  type: z.literal(PartTypeEnum.TEXT),
  text: z.string(),
});
export type PartText = z.infer<typeof PartText>;

export const PartReasoning = PartBase.extend({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
});
export type PartReasoning = z.infer<typeof PartReasoning>;

export const PartFile = PartBase.extend({
  type: z.literal(PartTypeEnum.FILE),
  mime: z.string(),
  filename: z.string().optional(),
  url: z.string(),
});
export type PartFile = z.infer<typeof PartFile>;

export const PartToolCall = PartBase.extend({
  type: z.literal(PartTypeEnum.TOOL_CALL),
  callID: ToolCallID,
  tool: z.string(),
  state: ToolCallState,
});
export type PartToolCall = z.infer<typeof PartToolCall>;

export enum StepBoundaryKindEnum {
  STEP_START = "step-start",
  STEP_STOP = "step-stop",
}
const StepBoundaryPartBase = PartBase.extend({
  type: z.literal(PartTypeEnum.STEP_BOUNDARY),
});
export const PartStepBoundaryStart = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_START),
});
export type PartStepBoundaryStart = z.infer<typeof PartStepBoundaryStart>;
export enum StepBoundaryStopReasonEnum {
  INTERRUPTED = "interrupted",
  TOOL_CALL_REQUEST = "tool-call-request",
  NORMAL = "normal",
  LENGTH = "length",
  CONTENT_FILTER = "content-filter",
}
export const PartStepBoundaryStop = StepBoundaryPartBase.extend({
  kind: z.literal(StepBoundaryKindEnum.STEP_STOP),
  reason: z.enum(StepBoundaryStopReasonEnum),
  model: ModelRef,
  tokens: TokenUsage,
});
export type PartStepBoundaryStop = z.infer<typeof PartStepBoundaryStop>;
export const PartStepBoundary = z.discriminatedUnion("kind", [
  PartStepBoundaryStart,
  PartStepBoundaryStop,
]);
export type PartStepBoundary = z.infer<typeof PartStepBoundary>;

export const PartUser = z.discriminatedUnion("type", [PartText, PartFile]);
export type PartUser = z.infer<typeof PartUser>;

export const PartAssistant = z.discriminatedUnion("type", [
  PartText,
  PartReasoning,
  PartFile,
  PartToolCall,
  PartStepBoundary,
]);
export type PartAssistant = z.infer<typeof PartAssistant>;

export const Part = z.union([PartAssistant, PartUser]);
export type Part = z.infer<typeof Part>;

// ---------------------------------------------------------------------------
// Message primitives
// ---------------------------------------------------------------------------
export enum MessageRoleEnum {
  USER = "user",
  ASSISTANT = "assistant",
}
const MessageBase = z.object({
  _version: z.literal(1),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  createdAt: z.number(),
});
export const MessageUser = MessageBase.extend({
  role: z.literal(MessageRoleEnum.USER),
  parts: z.array(PartUser),
  originDeviceID: DeviceID,
});
export type MessageUser = z.infer<typeof MessageUser>;

export enum MessageAssistantStatusEnum {
  SUCCESS = "success",
  ERROR = "error",
}
const MessageAssistantBase = MessageBase.extend({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  parts: z.array(PartAssistant),
});

export const MessageAssistantSuccess = MessageAssistantBase.extend({
  status: z.literal(MessageAssistantStatusEnum.SUCCESS),
  completedAt: z.number(),
});
export type MessageAssistantSuccess = z.infer<typeof MessageAssistantSuccess>;

export enum MessageAssistantErrorKindEnum {
  API = "api",
  CONTEXT_OVERFLOW = "context_overflow",
  UNKNOWN = "unknown",
}
const MessageAssistantErrorBase = MessageAssistantBase.extend({
  status: z.literal(MessageAssistantStatusEnum.ERROR),
  error: z.string(),
});
export const MessageAssistantErrorApi = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.API),
  statusCode: z.number(),
});
export type MessageAssistantErrorApi = z.infer<typeof MessageAssistantErrorApi>;
export const MessageAssistantErrorUnknown = MessageAssistantErrorBase.extend({
  kind: z.literal(MessageAssistantErrorKindEnum.UNKNOWN),
});
export type MessageAssistantErrorUnknown = z.infer<
  typeof MessageAssistantErrorUnknown
>;
export const MessageAssistantErrorContextOverflow =
  MessageAssistantErrorBase.extend({
    kind: z.literal(MessageAssistantErrorKindEnum.CONTEXT_OVERFLOW),
  });
export type MessageAssistantErrorContextOverflow = z.infer<
  typeof MessageAssistantErrorContextOverflow
>;

export const MessageAssistantError = z.discriminatedUnion("kind", [
  MessageAssistantErrorApi,
  MessageAssistantErrorUnknown,
  MessageAssistantErrorContextOverflow,
]);
export type MessageAssistantError = z.infer<typeof MessageAssistantError>;

export const MessageAssistant = z.discriminatedUnion("status", [
  MessageAssistantSuccess,
  MessageAssistantError,
]);
export type MessageAssistant = z.infer<typeof MessageAssistant>;

export const Message = z.discriminatedUnion("role", [
  MessageUser,
  MessageAssistant,
]);

export type Message = z.infer<typeof Message>;
