import { z } from "zod";
import {
  SessionID,
  MessageID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
} from "./id.js";

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

export enum ToolCallStatusEnum {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  ERROR = "error",
}
export const ToolCallPending = z.object({
  status: z.literal(ToolCallStatusEnum.PENDING),
  input: z.record(z.string(), z.unknown()),
});
export type ToolCallPending = z.infer<typeof ToolCallPending>;

enum ToolCallCompletedKindEnum {
  NORMAL = "normal",
  SUBAGENT = "subagent",
}
export const ToolCallCompletedBase = z.object({
  status: z.literal(ToolCallStatusEnum.COMPLETED),
  input: z.record(z.string(), z.unknown()),
  title: z.string(),
  output: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  completedAt: z.number(),
});
export const ToolCallCompletedNormal = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallCompletedKindEnum.NORMAL),
});
export const ToolCallCompletedSubagent = ToolCallCompletedBase.extend({
  kind: z.literal(ToolCallCompletedKindEnum.SUBAGENT),
  model: ModelRef,
  tokens: TokenUsage,
});
export const ToolCallCompleted = z.discriminatedUnion("kind", [
  ToolCallCompletedNormal,
  ToolCallCompletedSubagent,
]);
export type ToolCallCompleted = z.infer<typeof ToolCallCompleted>;

export const ToolCallError = z.object({
  status: z.literal(ToolCallStatusEnum.ERROR),
  input: z.record(z.string(), z.unknown()),
  error: z.string(),
  startedAt: z.number(),
  failedAt: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ToolCallError = z.infer<typeof ToolCallError>;

export const ToolCallState = z.discriminatedUnion("status", [
  ToolCallPending,
  ToolCallCompleted,
  ToolCallError,
]);
export type ToolCallState = z.infer<typeof ToolCallState>;

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
  synthetic: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type TextPart = z.infer<typeof TextPart>;

export const ReasoningPart = z.object({
  type: z.literal(PartTypeEnum.REASONING),
  text: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  input: z.record(z.string(), z.unknown()),
  state: ToolCallState,
  metadata: z.record(z.string(), z.unknown()).optional(),
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

export enum MessageErrorKindEnum {
  AUTH = "auth",
  API = "api",
  OUTPUT_LENGTH = "output_length",
  CONTEXT_OVERFLOW = "context_overflow",
  ABORTED = "aborted",
  UNKNOWN = "unknown",
}
export const MessageError = z.object({
  kind: z.enum(MessageErrorKindEnum),
  message: z.string(),
  statusCode: z.number().int().optional(),
  retryable: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type MessageError = z.infer<typeof MessageError>;

export enum MessageRoleEnum {
  USER = "user",
  ASSISTANT = "assistant",
}
export const UserMessage = z.object({
  role: z.literal(MessageRoleEnum.USER),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  parts: z.array(Part),
  createdAt: z.number(),
});
export type UserMessage = z.infer<typeof UserMessage>;

export enum AssistantMessageStatusEnum {
  SUCCESS = "success",
  ERROR = "error",
}
export const AssistantMessageBase = z.object({
  role: z.literal(MessageRoleEnum.ASSISTANT),
  id: MessageID,
  sessionID: SessionID,
  discussionID: DiscussionID,
  parts: z.array(Part),
  createdAt: z.number(),
});
export const AssistantMessageSuccess = AssistantMessageBase.extend({
  status: z.literal(AssistantMessageStatusEnum.SUCCESS),
  completedAt: z.number(),
});
export const AssistantMessageError = AssistantMessageBase.extend({
  status: z.literal(AssistantMessageStatusEnum.ERROR),
  error: MessageError,
});
export const AssistantMessage = z.discriminatedUnion("status", [
  AssistantMessageSuccess,
  AssistantMessageError,
]);
export type AssistantMessage = z.infer<typeof AssistantMessage>;

export const Message = z.discriminatedUnion("role", [
  UserMessage,
  AssistantMessage,
]);
export type Message = z.infer<typeof Message>;
