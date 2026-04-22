/**
 * Message schemas — kuib's own message format.
 *
 * These are NOT AI SDK messages. The engine translates between
 * kuib messages and AI SDK ModelMessages at the provider boundary.
 */

import { z } from "zod";
import {
  SessionID,
  MessageID,
  PartID,
  DiscussionID,
  ToolCallID,
  ProviderID,
  ModelID,
} from "./id.js";

// ---------------------------------------------------------------------------
// Token usage
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

// ---------------------------------------------------------------------------
// Tool call lifecycle states
// ---------------------------------------------------------------------------

export const ToolCallPending = z.object({
  status: z.literal("pending"),
  input: z.record(z.string(), z.unknown()),
});
export type ToolCallPending = z.infer<typeof ToolCallPending>;

export const ToolCallRunning = z.object({
  status: z.literal("running"),
  input: z.record(z.string(), z.unknown()),
  startedAt: z.number(),
  title: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ToolCallRunning = z.infer<typeof ToolCallRunning>;

export const ToolCallCompleted = z.object({
  status: z.literal("completed"),
  input: z.record(z.string(), z.unknown()),
  output: z.string(),
  title: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  startedAt: z.number(),
  completedAt: z.number(),
  attachments: z
    .array(
      z.object({
        mime: z.string(),
        filename: z.string().optional(),
        url: z.string(),
      }),
    )
    .optional(),
});
export type ToolCallCompleted = z.infer<typeof ToolCallCompleted>;

export const ToolCallError = z.object({
  status: z.literal("error"),
  input: z.record(z.string(), z.unknown()),
  error: z.string(),
  startedAt: z.number(),
  failedAt: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ToolCallError = z.infer<typeof ToolCallError>;

export const ToolCallState = z.discriminatedUnion("status", [
  ToolCallPending,
  ToolCallRunning,
  ToolCallCompleted,
  ToolCallError,
]);
export type ToolCallState = z.infer<typeof ToolCallState>;

// ---------------------------------------------------------------------------
// Content parts — the atoms of a message
// ---------------------------------------------------------------------------

export const TextPart = z.object({
  type: z.literal("text"),
  text: z.string(),
  synthetic: z.boolean().optional(),
  excluded: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type TextPart = z.infer<typeof TextPart>;

export const ReasoningPart = z.object({
  type: z.literal("reasoning"),
  text: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ReasoningPart = z.infer<typeof ReasoningPart>;

export const FilePart = z.object({
  type: z.literal("file"),
  mime: z.string(),
  filename: z.string().optional(),
  url: z.string(),
});
export type FilePart = z.infer<typeof FilePart>;

export const ToolCallPart = z.object({
  type: z.literal("tool-call"),
  callID: ToolCallID,
  tool: z.string(),
  input: z.record(z.string(), z.unknown()),
  state: ToolCallState,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ToolCallPart = z.infer<typeof ToolCallPart>;

export const StepBoundary = z.object({
  type: z.enum(["step-start", "step-finish"]),
  snapshot: z.string().optional(),
  tokens: TokenUsage.optional(),
  cost: z.number().optional(),
  finishReason: z.string().optional(),
});
export type StepBoundary = z.infer<typeof StepBoundary>;

export const CompactionPart = z.object({
  type: z.literal("compaction"),
  auto: z.boolean(),
});
export type CompactionPart = z.infer<typeof CompactionPart>;

export const Part = z.discriminatedUnion("type", [
  TextPart,
  ReasoningPart,
  FilePart,
  ToolCallPart,
  StepBoundary,
  CompactionPart,
]);
export type Part = z.infer<typeof Part>;

// ---------------------------------------------------------------------------
// Message errors
// ---------------------------------------------------------------------------

export const MessageErrorKind = z.enum([
  "auth",
  "api",
  "output_length",
  "context_overflow",
  "aborted",
  "unknown",
]);
export type MessageErrorKind = z.infer<typeof MessageErrorKind>;

export const MessageError = z.object({
  kind: MessageErrorKind,
  message: z.string(),
  statusCode: z.number().int().optional(),
  retryable: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type MessageError = z.infer<typeof MessageError>;

// ---------------------------------------------------------------------------
// Model reference (reused in both message types)
// ---------------------------------------------------------------------------

export const ModelRef = z.object({
  providerID: ProviderID,
  modelID: ModelID,
});
export type ModelRef = z.infer<typeof ModelRef>;

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const UserMessage = z.object({
  id: MessageID,
  sessionID: SessionID,
  role: z.literal("user"),
  discussionID: DiscussionID,
  parts: z.array(Part),
  createdAt: z.number(),
  model: ModelRef,
  variant: z.string().optional(),
});
export type UserMessage = z.infer<typeof UserMessage>;

export const AssistantMessage = z.object({
  id: MessageID,
  sessionID: SessionID,
  role: z.literal("assistant"),
  discussionID: DiscussionID,
  parentID: MessageID,
  parts: z.array(Part),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  model: ModelRef,
  tokens: TokenUsage,
  cost: z.number(),
  error: MessageError.optional(),
  variant: z.string().optional(),
  finishReason: z.string().optional(),
});
export type AssistantMessage = z.infer<typeof AssistantMessage>;

export const Message = z.discriminatedUnion("role", [
  UserMessage,
  AssistantMessage,
]);
export type Message = z.infer<typeof Message>;

export const MessageWithParts = z.object({
  info: Message,
  parts: z.array(Part),
});
export type MessageWithParts = z.infer<typeof MessageWithParts>;
